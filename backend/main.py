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

# Tipos de archivo aceptados (extensiones y MIME types)
ACCEPTED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.pdf', '.heic', '.heif', '.webp', '.bmp', '.tiff', '.tif'}
ACCEPTED_MIME_PREFIXES = ('image/', 'application/pdf')

def is_valid_file(filename: str, content_type: str) -> bool:
    """Valida por extensión O por MIME type para máxima compatibilidad (iPhone HEIC, etc.)"""
    ext_valid = any(filename.lower().endswith(ext) for ext in ACCEPTED_EXTENSIONS)
    mime_valid = content_type and any(content_type.startswith(p) for p in ACCEPTED_MIME_PREFIXES)
    # Si no tiene extensión válida pero el MIME sí es imagen/pdf, igual aceptar
    return ext_valid or mime_valid

@app.post("/api/v1/extract", response_model=ComprobanteAFIP)
async def process_file(file: UploadFile = File(...), client_id: Optional[str] = Form(None)):
    """
    Recibe un archivo (imagen o PDF) y delega el análisis al motor de IA Gemini.
    Soporta JPG, PNG, PDF, HEIC (iPhone), WEBP, BMP, TIFF.
    """
    filename = file.filename or ""
    content_type = file.content_type or "application/octet-stream"
    
    if not is_valid_file(filename, content_type):
        raise HTTPException(
            status_code=400, 
            detail=f"El archivo '{filename}' no es válido. Se aceptan imágenes (JPG, PNG, HEIC, WEBP) o PDF."
        )
    
    # Mapeo de códigos AFIP según tipo de comprobante (RG 3685)
    CODIGO_AFIP_MAP = {
        # Facturas electrónicas
        'A': 1, 'B': 6, 'C': 11, 'M': 51, 'E': 19, 'T': 15,
        # Notas de débito
        'ND A': 2, 'ND B': 7, 'ND C': 12,
        # Notas de crédito  
        'NC A': 3, 'NC B': 8, 'NC C': 13,
    }
    
    try:
        contents = await file.read()
        
        # Normalizar MIME type: HEIC/HEIF → image/jpeg para compatibilidad con Gemini
        mime_type = content_type
        if mime_type in ('image/heic', 'image/heif', 'application/octet-stream') or not mime_type:
            mime_type = "image/jpeg"
        # Asegurar que PDF tiene el MIME correcto
        if filename.lower().endswith('.pdf'):
            mime_type = "application/pdf"
        
        SYSTEM_PROMPT = """Eres un Contador Público Nacional argentino experto en comprobantes fiscales ARCA/AFIP.
Analiza el comprobante en la imagen y extrae todos los datos en el esquema JSON solicitado.

== IDENTIFICACIÓN DEL TIPO DE DOCUMENTO ==
Clasifica en "tipo_documento" con uno de estos valores EXACTOS (sin variaciones):
- "factura"            → Facturas electrónicas con CAE (A, B, C, M, E). Emitidas digitalmente.
- "ticket_fiscal"      → Tickets de Controlador Fiscal (impresoras fiscales registradas en ARCA). Tienen número de equipo fiscal. SIN CAE. Pueden decir "Ticket", "Comp. X", "Comprobante", o simplemente tener logo de la empresa y totales.
- "ticket_factura"     → Ticket Factura emitido por Controlador Fiscal. Tiene numeración tipo factura (XXXXX-YYYYYYYY) pero emitido desde equipo fiscal. Puede tener o no CAE.
- "ticket_combustible" → Ticket de YPF, Shell, Axion, Puma u otra estación de servicio. Desglose de nafta/gasoil con ITC o impuestos al combustible.

== CAMPO razon_social_emisor ==
EXTRAER SIEMPRE la razón social del emisor (empresa que emitió el ticket o factura).
Buscar en: encabezado, sello, membrete, nombre en negrita, "Razón Social:", o cualquier nombre de empresa visible.
Si es cadena conocida (McDonald's, YPF, Carrefour, COTO, Disco, Easy, etc.), usar el nombre oficial.
Si no está visible → null.

== PUNTO DE VENTA y NÚMERO ==
punto_venta: los primeros 4 o 5 dígitos ANTES del guión en el número del comprobante. Ej: "0001-00012345" → punto_venta="00001"
numero_comprobante: los dígitos DESPUÉS del guión. Ej: "0001-00012345" → numero_comprobante="00000012345"
Si el comprobante no tiene guión y es un ticket fiscal, el número de equipo es el punto de venta.

== CÓDIGO AFIP (codigo_afip_sugerido) ==
Asignar el código numérico según el tipo:
- Factura A = 1, Factura B = 6, Factura C = 11, Factura M = 51, Factura E = 19
- Nota débito A = 2, Nota débito B = 7, Nota débito C = 12
- Nota crédito A = 3, Nota crédito B = 8, Nota crédito C = 13
- Ticket fiscal (genérico) = 89, Ticket Factura A = 81, Ticket Factura B = 82, Ticket Factura C = 83
- Ticket combustible = 89
Si no puedes determinarlo con certeza → null.

== REGLAS DE IVA Y NETOS ==
Facturas A y M → discriminan IVA. Extraer neto_gravado_21 e iva_21 (o 10.5/27 según alícuota).
Facturas B, C, E, T → NO discriminan. Todos los campos iva_* y neto_gravado_* = 0. Total va solo en "total".
Tickets fiscales → NO discriminan. Todo en "total". iva_* = 0. neto_gravado_* = 0.
Si el ticket DICE EXPRESAMENTE "IVA 21%: $XXX" → entonces sí extraer el neto e IVA declarado.
Tickets combustible → si tiene "IVA 21%" explícito, extraer. El ITC (Impuesto Transferencia Combustibles) va en percepcion_iva.

== PERCEPCIONES ==
Buscar en el comprobante textos como:
- "Percepción IVA" / "Perc. IVA" / "Ret. IVA" → percepcion_iva
- "Percepción IIBB" / "Perc. Ing. Brutos" → percepcion_iibb
- "Percepción Ganancias" / "Perc. Gcias" → percepcion_ganancias
- "Percepción SUSS" / "Perc. Seguridad Social" → percepcion_suss

== VALIDACIÓN MATEMÁTICA OBLIGATORIA ==
neto_gravado_21 + neto_gravado_105 + neto_gravado_27 + exento + no_gravado + iva_21 + iva_105 + iva_27 + percepcion_iva + percepcion_iibb + percepcion_ganancias + percepcion_suss = total
Si la suma no cierra, revisar y ajustar los importes hasta que cierren.

== FORMATO DE FECHA == YYYY-MM-DD
== CUIT == 11 dígitos sin guiones. Si no es visible → "00000000000"
== CAE == Solo para facturas electrónicas. Tickets fiscales → null.
"""
        
        image_part = types.Part.from_bytes(data=contents, mime_type=mime_type)
        
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[SYSTEM_PROMPT, "Extrae todos los datos de este comprobante argentino con máxima precisión.", image_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ComprobanteAFIP,
                temperature=0.0,
                thinking_config=types.ThinkingConfig(thinking_budget=5000)
            )
        )
        
        extracted_data = response.parsed
        
        # Auto-inferir codigo_afip si no viene del modelo
        if extracted_data and not extracted_data.codigo_afip_sugerido:
            tipo = (extracted_data.tipo_comprobante or '').upper().strip()
            tipo_doc = extracted_data.tipo_documento or 'factura'
            if tipo_doc in ('ticket_fiscal', 'ticket_combustible'):
                extracted_data.codigo_afip_sugerido = 89
            elif tipo_doc == 'ticket_factura':
                code_map = {'A': 81, 'B': 82, 'C': 83}
                extracted_data.codigo_afip_sugerido = code_map.get(tipo, 89)
            else:
                extracted_data.codigo_afip_sugerido = CODIGO_AFIP_MAP.get(tipo)
        
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
