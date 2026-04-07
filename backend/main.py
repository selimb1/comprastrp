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
from database import engine, Base
import logging

try:
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    logging.info("Conexión a la base de datos exitosa.")
except Exception as e:
    logging.error(f"Falla inicializando la base de datos (Posible falta de DATABASE_URL): {e}")

# CORS para que el Frontend local acceda a la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En prod debe ser restringido
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(auth.router)  # Removiendo autenticación

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
    tipo_documento: str = Field(
        default="factura",
        description="Categoría del comprobante: 'factura' | 'ticket_fiscal' | 'ticket_factura' | 'ticket_combustible'"
    )
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

from fastapi import Form

@app.post("/api/v1/extract", response_model=ComprobanteAFIP)
async def process_file(file: UploadFile = File(...), client_id: Optional[str] = Form(None)):
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
        
        SYSTEM_PROMPT = """Actúa como un Contador Público Nacional de Argentina experto en facturación ARCA.
Extrae los datos del comprobante fiscal (foto provista) estrictamente en el esquema solicitado.

== IDENTIFICACIÓN DEL TIPO DE DOCUMENTO ==
Clasifica el comprobante en el campo "tipo_documento" con uno de estos valores EXACTOS:
- "factura"          → Facturas electrónicas (A, B, C, M, E) emitidas por el sistema de facturación electrónica de ARCA. Tienen CAE.
- "ticket_fiscal"   → Tickets emitidos por equipos de Controlador Fiscal (impresoras fiscales). NO tienen CAE. Tienen un número de comprobante del equipo fiscal. Pueden decir "Ticket", "COMPROBANTE X" o similares. El tipo suele ser solo el número de letra (A, B) o directamente sin letra.
- "ticket_factura"  → Ticket Factura o Ticket Factura de Controlador Fiscal. Combina características de factura y ticket. Tienen número de factura pero emitido desde equipo fiscal.
- "ticket_combustible" → Ticket o Factura de estación de servicio / combustible (YPF, Shell, Axion, Puma, etc.). Suelen desglosar impuestos al combustible. Pueden estar generados por controlador fiscal o electrónicamente.

== REGLAS PARA FACTURAS ELECTRÓNICAS (tipo_documento = "factura") ==
1. Facturas A y M: El IVA se desglosa del precio neto (discriminado). Extrae los montos de neto_gravado_* e iva_*.
2. Facturas B, C, E y T: NO discriminan IVA (o está incluido/no alcanzado). DEBES devolver todos los campos iva_* y neto_gravado_* en 0. Asigna el importe total ÚNICAMENTE al campo "total" (o también a "no_gravado"/"exento" si el comprobante así lo dice expresamente). JAMAS deduzcas matemáticamente el IVA de una Factura B.

== REGLAS PARA TICKETS FISCALES (tipo_documento = "ticket_fiscal") ==
3. Los tickets de controlador fiscal generalmente NO discriminan IVA visible. Pon iva_* y neto_gravado_* en 0. El importe total va en el campo "total".
4. Si el ticket dice expresamente "IVA 21%: $XXX" o discrimina el IVA, entonces sí extraer neto_gravado_21 e iva_21.
5. El campo "cae" debe ser null para tickets fiscales (no tienen CAE). En cambio pueden tener un número de comprobante interno del equipo.
6. El punto_venta es el número de la caja/equipo fiscal.

== REGLAS PARA TICKET FACTURA (tipo_documento = "ticket_factura") ==
7. Similar a factura electrónica pero emitido por equipo fiscal. Si tiene letra A, discrimina IVA. Si tiene letra B, no discrimina.
8. Puede o no tener CAE. Extraer si está presente.

== REGLAS PARA TICKET COMBUSTIBLE (tipo_documento = "ticket_combustible") ==
9. Los tickets de combustible pueden tener IVA discriminado o no. Si lo discriminan, extraer neto_gravado_21 e iva_21.
10. Combustibles (nafta, gasoil) tienen alícuota de IVA del 21% más impuestos internos al combustible. Si ves "Imp. Transferencia Combustibles" o "ITC", ese monto va en percepcion_iva (campo más cercano disponible).
11. El emisor suele ser la estación de servicio (ej: YPF S.A., SHELL COMPAÑIA ARGENTINA DE PETROLEO S.A., etc.).

== REGLAS GENERALES ==
12. Asegúrate de que la matemática cierre perfecto (netos + ivas + percepciones + exento/no_gravado = total).
13. Entiende "F.B." como Factura B y "F.A." como Factura A.
14. Las fechas en formato YYYY-MM-DD.
15. Si el CUIT no está visible (ej. ticket simple sin CUIT), usa "00000000000" como placeholder.
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
