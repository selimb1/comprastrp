from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import date
from fastapi.middleware.cors import CORSMiddleware
import base64
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Si no hay API Key, mostramos advertencia (pero no hardcodeamos keys viejas para evitar alertas de seguridad)
    print("⚠️  ADVERTENCIA: La GEMINI_API_KEY no está configurada en backend/.env")
    print("Por favor, obtén una en: https://aistudio.google.com/app/apikey")

client = genai.Client(api_key=api_key if api_key else "DUMMY_KEY")

app = FastAPI(title="ComproScan AR API", description="Motor Inteligente de procesamiento de facturas ARG")

from export_engine import generate_generic_csv, generate_holistor_txt

# CORS para que el Frontend local acceda a la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En prod debe ser restringido
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Importes(BaseModel):
    neto_gravado_21: float = 0.0
    neto_gravado_105: float = 0.0
    neto_gravado_27: float = 0.0
    exento: float = 0.0
    no_gravado: float = 0.0
    iva_21: float = 0.0
    iva_105: float = 0.0
    iva_27: float = 0.0
    percepcion_iva: float = 0.0
    percepcion_iibb: float = 0.0
    percepcion_ganancias: float = 0.0
    percepcion_suss: float = 0.0
    total: float

class ComprobanteAFIP(BaseModel):
    tipo_comprobante: str = Field(..., description="Tipo como A, B, C, M, E, T, etc.")
    codigo_afip_sugerido: Optional[int] = None
    punto_venta: str = Field(..., description="Punto de venta de 4 a 5 dígitos")
    numero_comprobante: str = Field(..., description="Número de 8 dígitos")
    fecha_emision: date
    cuit_emisor: str = Field(..., pattern=r"^\d{11}$")
    razon_social_emisor: Optional[str] = None
    cuit_receptor: Optional[str] = None
    moneda: str = "ARS"
    importes: Importes
    cae: Optional[str] = None

@app.get("/")
def health_check():
    return {"status": "ok", "message": "ComproScan AR API is running!"}

@app.post("/api/v1/extract", response_model=ComprobanteAFIP)
async def process_file(file: UploadFile = File(...)):
    """
    Recibe un archivo y delega el análisis al motor de IA multimodelo (OpenAI).
    """
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.pdf')):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen o PDF.")
    
    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        
        # En caso de PDF, requeriría pdf2image, pero lo simplificamos para el MVP con imágenes directas.
        mime_type = file.content_type if file.content_type else "image/jpeg"
        
        SYSTEM_PROMPT = """Actúa como un Contador Público Nacional de Argentina experto en facturación AFIP.
Extrae los datos del comprobante fiscal (foto provista) estrictamente en el esquema solicitado.
Reglas IMPORTANTES y OBLIGATORIAS:
- Las Facturas "C" y los tickets de monotributistas JAMÁS discriminan IVA. Devuelve todos los campos iva_* y neto_gravado_* en 0, y pon todo en "no_gravado" o directamente solo en "total".
- Entiende "F.B." como Factura B y "F.A." como Factura A.
- Asegúrate de que matemática cierre perfecto (netos + ivas + percepciones = total).
- Las fechas en formato YYYY-MM-DD.
"""
        
        image_part = types.Part.from_bytes(data=contents, mime_type=mime_type)
        
        # Async Google GenAI call with Pydantic structured output
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash", # Restaurado a 2.5-flash para saltar la limitación de cuota de 2.0
            contents=[SYSTEM_PROMPT, "Extrae detalladamente los datos de este comprobante argentino.", image_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ComprobanteAFIP,
                temperature=0.0
            )
        )
        
        extracted_data = response.parsed
        return extracted_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        
        error_msg = str(e)
        if "API key not valid" in error_msg:
            error_msg = "Error de Servidor: La GEMINI_API_KEY es inválida. Revisa tu archivo backend/.env"
        elif "model not found" in error_msg.lower():
            error_msg = "Error de Servidor: El modelo de IA no está disponible en tu región o no existe."
            
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/v1/export/csv")
def export_csv(comprobantes: List[ComprobanteAFIP]):
    """
    Recibe el array final de comprobantes validados y retorna un CSV descargable.
    """
    # model_dump() convierte Pydantic a dict
    csv_data = generate_generic_csv([c.model_dump() for c in comprobantes])
    return Response(
        content=csv_data, 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=comprobantes_export.csv"}
    )

@app.post("/api/v1/export/txt")
def export_txt(comprobantes: List[ComprobanteAFIP]):
    """
    Recibe comprobantes y exporta a formato plano de ancho fijo (Holistor / AFIP).
    """
    txt_data = generate_holistor_txt([c.model_dump() for c in comprobantes])
    return Response(
        content=txt_data, 
        media_type="text/plain", 
        headers={"Content-Disposition": "attachment; filename=holistor_citi_compras.txt"}
    )
