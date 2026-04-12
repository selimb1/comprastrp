"""
============================================================
ComproScan AR — Router de Conciliación Bancaria
============================================================
Endpoints:
  POST /api/v1/reconciliation/upload  → Extrae movimientos de un extracto bancario (PDF/CSV)
  POST /api/v1/reconciliation/match   → Ejecuta el matching automático contra comprobantes
  POST /api/v1/reconciliation/report  → Genera reporte de conciliación (PDF/Excel)

Algoritmo de matching:
  Criterios ponderados (scores 0-100):
  - importe_exacto      : +50 pts  (diferencia < $1)
  - importe_aproximado  : +30 pts  (diferencia < 2%)
  - fecha_exacta        : +20 pts  (misma fecha)
  - fecha_proxima       : +10 pts  (±3 días hábiles)
  - cuit_coincide       : +20 pts  (CUIT en descripción == CUIT del comprobante)
  - referencia_coincide : +15 pts  (número de cheque / transferencia coincide)
  - descripcion_similar : +10 pts  (substring match normalizado)
  Umbral automático     : score >= 60 → 'automatico'
  Umbral semi           : score 30-59 → 'sugerido'
  Debajo de 30          → no se sugiere
============================================================
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, timedelta
import uuid
import re
import io
import csv
import os
import base64
from google import genai
from google.genai import types
import fitz  # PyMuPDF

router = APIRouter(prefix="/api/v1/reconciliation", tags=["Conciliación Bancaria"])

# ──────────────────────────────────────────────
# Modelos Pydantic
# ──────────────────────────────────────────────

class BankTransactionModel(BaseModel):
    id: str
    fecha: str
    fecha_valor: Optional[str] = None
    descripcion: str
    descripcion_normalizada: Optional[str] = None
    importe: float
    tipo: str  # 'debito' | 'credito'
    saldo: Optional[float] = None
    referencia: Optional[str] = None
    cuit_contraparte: Optional[str] = None
    categoria: Optional[str] = None
    banco_origen: Optional[str] = None
    status: str = "pendiente"
    matched_voucher_ids: List[str] = []
    confidence: Optional[str] = None
    confidence_score: Optional[int] = None
    notas: Optional[str] = None


class BankStatementModel(BaseModel):
    id: str
    client_id: str
    banco: str
    cuenta: Optional[str] = None
    periodo_desde: str
    periodo_hasta: str
    moneda: str = "ARS"
    saldo_inicial: Optional[float] = None
    saldo_final: Optional[float] = None
    total_debitos: float
    total_creditos: float
    transactions: List[BankTransactionModel]
    archivo_nombre: str
    archivo_tipo: str
    created_at: str


class ReconciliationMatchModel(BaseModel):
    id: str
    transaction_id: str
    voucher_ids: List[str]
    tipo: str  # 'automatico' | 'manual' | 'parcial'
    confidence: str
    confidence_score: int
    diferencia: float
    criterios: List[str]
    created_at: str
    confirmed: bool
    notas: Optional[str] = None


class ReconciliationStatsModel(BaseModel):
    total_transacciones: int
    conciliadas: int
    pendientes: int
    excluidas: int
    manuales: int
    porcentaje_conciliado: float
    diferencia_total: float
    total_debitos: float
    total_creditos: float
    total_comprobantes_conciliados: int


class StatementUploadResponse(BaseModel):
    statement: BankStatementModel
    auto_matches: List[ReconciliationMatchModel]
    stats: ReconciliationStatsModel


class VoucherInput(BaseModel):
    id: str
    tipo_comprobante: str
    tipo_documento: str
    punto_venta: str
    numero_comprobante: str
    fecha_emision: str
    cuit_emisor: str
    razon_social_emisor: Optional[str] = None
    total: float
    moneda: str = "ARS"
    reconciliation_status: str = "pendiente"
    matched_transaction_ids: List[str] = []


class MatchRequest(BaseModel):
    client_id: str
    statement: BankStatementModel
    vouchers: List[VoucherInput]


class ReportRequest(BaseModel):
    session_id: str
    client_id: str
    formato: str = "excel"  # 'pdf' | 'excel'
    incluir_detalle: bool = True
    incluir_pendientes: bool = True
    notas_adicionales: Optional[str] = None


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def normalize_amount(text: str) -> Optional[float]:
    """Extrae un número de un string de banco argentino. Formatos: 1.234,56 | 1234,56 | $1.234,56"""
    text = text.replace('$', '').replace(' ', '').strip()
    # Formato argentino: 1.234,56
    if '.' in text and ',' in text:
        text = text.replace('.', '').replace(',', '.')
    elif ',' in text:
        text = text.replace(',', '.')
    try:
        return float(text)
    except ValueError:
        return None


def extract_cuit(text: str) -> Optional[str]:
    """Extrae CUIT de un string (con o sin guiones)."""
    match = re.search(r'\b(\d{2}[-\s]?\d{8}[-\s]?\d)\b', text)
    if match:
        return re.sub(r'[-\s]', '', match.group(1))
    return None


def extract_cheque_number(text: str) -> Optional[str]:
    """Extrae número de cheque de la descripción del banco."""
    patterns = [r'CHQ[\s.-]?(\d{6,10})', r'CHEQUE[\s]?NRO[\s]?(\d+)', r'N[°º](\d{6,10})']
    for p in patterns:
        m = re.search(p, text.upper())
        if m:
            return m.group(1)
    return None


def score_match(tx: BankTransactionModel, voucher: VoucherInput) -> tuple[int, list[str]]:
    """
    Calcula el score de match entre una transacción bancaria y un comprobante.
    Retorna (score: int, criterios: list[str]).
    """
    score = 0
    criterios = []
    
    # ── Criterio 1: Importe ──────────────────────────────────
    diff = abs(tx.importe - voucher.total)
    if diff < 1.0:
        score += 50
        criterios.append('importe_exacto')
    elif diff / max(tx.importe, 1) < 0.02:  # 2% tolerancia
        score += 30
        criterios.append('importe_aproximado')
    
    # ── Criterio 2: Fecha ────────────────────────────────────
    try:
        tx_date = date.fromisoformat(tx.fecha)
        v_date = date.fromisoformat(voucher.fecha_emision)
        days_diff = abs((tx_date - v_date).days)
        if days_diff == 0:
            score += 20
            criterios.append('fecha_exacta')
        elif days_diff <= 3:
            score += 10
            criterios.append('fecha_proxima')
    except Exception:
        pass
    
    # ── Criterio 3: CUIT ─────────────────────────────────────
    cuit_in_desc = extract_cuit(tx.descripcion)
    if cuit_in_desc and cuit_in_desc == voucher.cuit_emisor:
        score += 20
        criterios.append('cuit_coincide')
    elif tx.cuit_contraparte and tx.cuit_contraparte == voucher.cuit_emisor:
        score += 20
        criterios.append('cuit_coincide')
    
    # ── Criterio 4: Referencia ───────────────────────────────
    if tx.referencia and voucher.numero_comprobante:
        if tx.referencia in voucher.numero_comprobante or voucher.numero_comprobante.endswith(tx.referencia[-6:]):
            score += 15
            criterios.append('referencia_coincide')
    
    # ── Criterio 5: Descripción ──────────────────────────────
    if voucher.razon_social_emisor:
        razon_words = set(voucher.razon_social_emisor.lower().split())
        desc_lower = tx.descripcion.lower()
        matches_words = sum(1 for w in razon_words if len(w) > 3 and w in desc_lower)
        if matches_words >= 1:
            score += 10
            criterios.append('descripcion_similar')
    
    return score, criterios


def calc_stats(transactions: List[BankTransactionModel], matches: List[ReconciliationMatchModel]) -> ReconciliationStatsModel:
    total = len(transactions)
    conciliadas = sum(1 for t in transactions if t.status == 'conciliado')
    pendientes = sum(1 for t in transactions if t.status == 'pendiente')
    excluidas = sum(1 for t in transactions if t.status == 'excluido')
    manuales = sum(1 for t in transactions if t.status == 'manual')
    total_debitos = sum(t.importe for t in transactions if t.tipo == 'debito')
    total_creditos = sum(t.importe for t in transactions if t.tipo == 'credito')
    diferencia_total = sum(abs(m.diferencia) for m in matches)
    total_comprobantes = sum(len(m.voucher_ids) for m in matches)

    return ReconciliationStatsModel(
        total_transacciones=total,
        conciliadas=conciliadas,
        pendientes=pendientes,
        excluidas=excluidas,
        manuales=manuales,
        porcentaje_conciliado=round((conciliadas / total) * 100, 1) if total > 0 else 0.0,
        diferencia_total=round(diferencia_total, 2),
        total_debitos=round(total_debitos, 2),
        total_creditos=round(total_creditos, 2),
        total_comprobantes_conciliados=total_comprobantes,
    )


# ──────────────────────────────────────────────
# Gemini prompt para extractos bancarios ARG
# ──────────────────────────────────────────────

EXTRACTO_SYSTEM_PROMPT = """
Eres un asistente contable argentino especializado en extractos bancarios de Argentina.
Tu tarea: analizar el documento y extraer TODOS los movimientos bancarios en formato JSON estructurado.

== BANCOS ARGENTINOS SOPORTADOS ==
Banco Nación, Galicia, BBVA, Santander, Macro, Patagonia, ICBC, Supervielle, Credicoop,
Ciudad de Buenos Aires, Provincia de Buenos Aires, Brubank, Naranja X, Mercado Pago, Ualá.

== EXTRACCIÓN DE MOVIMIENTOS ==
Para cada movimiento extraer:
- fecha: 'YYYY-MM-DD'
- fecha_valor: 'YYYY-MM-DD' (si disponible)  
- descripcion: texto EXACTO del banco, sin truncar
- importe: número positivo (nunca negativo)
- tipo: 'debito' (egreso, pago, extracción) | 'credito' (acreditación, depósito, transferencia recibida)
- saldo: saldo posterior al movimiento (si la columna existe)
- referencia: número de cheque, transferencia, o código de operación si aparece
- cuit_contraparte: CUIT de 11 dígitos sin guiones (extraer de descripción si aparece)
- categoria: clasificar en 'pago_proveedor' | 'cobro_cliente' | 'impuesto' | 'comision_bancaria' | 'transferencia' | 'deposito_efectivo' | 'reintegro' | 'otro'

== INFORMACIÓN DEL EXTRACTO ==
- banco: nombre del banco detectado
- cuenta: número de cuenta / CBU si aparece  
- periodo_desde / periodo_hasta: 'YYYY-MM-DD'
- moneda: 'ARS' | 'USD'
- saldo_inicial / saldo_final si aparecen

== FORMATOS DE FECHA COMUNES EN ARGENTINA ==
DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY

== IMPORTANTE ==
- Incluir TODOS los movimientos, sin omitir ninguno
- No inventar importes ni fechas
- Si el PDF está mal escaneado, inferir lo que puedas con alta confianza
- Los importes en formato argentino tienen punto como separador de miles y coma como decimales
"""


# ──────────────────────────────────────────────
# Endpoint 1: Upload + Extracción IA
# ──────────────────────────────────────────────

@router.post("/upload", response_model=StatementUploadResponse)
async def upload_and_extract(
    files: List[UploadFile] = File(...),
    client_id: str = Form(...),
    banco: Optional[str] = Form(None),
):
    """
    Sube un extracto bancario (PDF o CSV), lo procesa con Gemini y retorna:
    - El extracto parseado con todos los movimientos
    - Los matches automáticos encontrados (sin vouchers del cliente, se pasan en /match)
    - Estadísticas preliminares
    """
    if not files:
        raise HTTPException(status_code=400, detail="Debe subir al menos un archivo.")

    all_transactions: list[BankTransactionModel] = []
    detected_banco = banco or "Banco Desconocido"
    periodo_desde = "2024-01-01"
    periodo_hasta = "2024-12-31"
    saldo_inicial: Optional[float] = None
    saldo_final: Optional[float] = None
    cuenta: Optional[str] = None

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_client = genai.Client(api_key=gemini_api_key) if gemini_api_key else None

    for upload_file in files:
        filename = upload_file.filename or "extracto"
        content_type = upload_file.content_type or "application/pdf"
        contents = await upload_file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"El archivo {filename} supera los 10MB.")

        # ── CSV / TXT: parseo directo ──────────────────────────────
        if filename.lower().endswith('.csv') or 'csv' in content_type:
            try:
                text = contents.decode('utf-8', errors='replace')
                reader = csv.DictReader(io.StringIO(text))
                for i, row in enumerate(reader):
                    # Intentar mapear columnas comunes de home banking arg
                    fecha_raw = row.get('Fecha', row.get('fecha', row.get('FECHA', '')))
                    desc_raw = row.get('Descripción', row.get('descripcion', row.get('Concepto', '')))
                    importe_raw = row.get('Importe', row.get('importe', row.get('Monto', '0')))
                    tipo_raw = row.get('Tipo', row.get('tipo', ''))
                    saldo_raw = row.get('Saldo', row.get('saldo', None))
                    
                    importe = normalize_amount(importe_raw) or 0.0
                    tipo = 'debito' if importe < 0 or 'deb' in tipo_raw.lower() else 'credito'
                    importe = abs(importe)
                    
                    tx = BankTransactionModel(
                        id=str(uuid.uuid4()),
                        fecha=fecha_raw[:10] if len(fecha_raw) >= 10 else fecha_raw,
                        descripcion=desc_raw,
                        importe=importe,
                        tipo=tipo,
                        saldo=normalize_amount(saldo_raw) if saldo_raw else None,
                        banco_origen=detected_banco,
                        status='pendiente',
                        matched_voucher_ids=[],
                    )
                    all_transactions.append(tx)
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Error parseando CSV: {str(e)}")

        # ── PDF/Image: usar Gemini ─────────────────────────────────
        else:
            if not gemini_client:
                raise HTTPException(
                    status_code=503,
                    detail="GEMINI_API_KEY no configurada. Configura la clave en Render."
                )

            mime = "image/jpeg"
            if 'pdf' in (content_type or '').lower() or filename.lower().endswith('.pdf'):
                doc = fitz.open(stream=contents, filetype="pdf")
                if len(doc) == 0:
                    raise HTTPException(status_code=400, detail="PDF vacío o dañado")
                page = doc.load_page(0)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                contents = pix.tobytes("jpeg")

            try:
                # Schema simplificado para la respuesta de Gemini
                class TxSchema(BaseModel):
                    fecha: str
                    fecha_valor: Optional[str] = None
                    descripcion: str
                    importe: float
                    tipo: str
                    saldo: Optional[float] = None
                    referencia: Optional[str] = None
                    cuit_contraparte: Optional[str] = None
                    categoria: Optional[str] = None

                class ExtractSchema(BaseModel):
                    banco: str
                    cuenta: Optional[str] = None
                    periodo_desde: str
                    periodo_hasta: str
                    moneda: str = "ARS"
                    saldo_inicial: Optional[float] = None
                    saldo_final: Optional[float] = None
                    transactions: List[TxSchema]

                response = await gemini_client.aio.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        EXTRACTO_SYSTEM_PROMPT,
                        "Extrae todos los movimientos de este extracto bancario argentino.",
                        types.Part.from_bytes(data=contents, mime_type=mime)
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ExtractSchema,
                        temperature=0.0
                    )
                )

                extracted = response.parsed
                if extracted:
                    detected_banco = extracted.banco or detected_banco
                    periodo_desde = extracted.periodo_desde
                    periodo_hasta = extracted.periodo_hasta
                    saldo_inicial = extracted.saldo_inicial
                    saldo_final = extracted.saldo_final
                    cuenta = extracted.cuenta
                    
                    for tx in extracted.transactions:
                        all_transactions.append(BankTransactionModel(
                            id=str(uuid.uuid4()),
                            fecha=tx.fecha,
                            fecha_valor=tx.fecha_valor,
                            descripcion=tx.descripcion,
                            importe=abs(tx.importe),
                            tipo=tx.tipo,
                            saldo=tx.saldo,
                            referencia=tx.referencia,
                            cuit_contraparte=tx.cuit_contraparte,
                            categoria=tx.categoria,
                            banco_origen=detected_banco,
                            status='pendiente',
                            matched_voucher_ids=[],
                        ))
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error procesando con IA: {str(e)}")

    # ── Calcular totales ────────────────────────────────────────
    total_debitos = sum(t.importe for t in all_transactions if t.tipo == 'debito')
    total_creditos = sum(t.importe for t in all_transactions if t.tipo == 'credito')

    statement = BankStatementModel(
        id=str(uuid.uuid4()),
        client_id=client_id,
        banco=detected_banco,
        cuenta=cuenta,
        periodo_desde=periodo_desde,
        periodo_hasta=periodo_hasta,
        moneda="ARS",
        saldo_inicial=saldo_inicial,
        saldo_final=saldo_final,
        total_debitos=round(total_debitos, 2),
        total_creditos=round(total_creditos, 2),
        transactions=all_transactions,
        archivo_nombre=files[0].filename or "extracto",
        archivo_tipo="pdf",
        created_at=__import__('datetime').datetime.now().isoformat(),
    )

    # Sin vouchers aún → sin matches
    stats = calc_stats(all_transactions, [])

    return StatementUploadResponse(
        statement=statement,
        auto_matches=[],
        stats=stats,
    )


# ──────────────────────────────────────────────
# Endpoint 2: Matching automático
# ──────────────────────────────────────────────

@router.post("/match")
async def run_auto_match(req: MatchRequest):
    """
    Ejecuta el algoritmo de matching ponderado entre los movimientos bancarios
    y los comprobantes del cliente.
    
    Score >= 60 → match automático (tipo: 'automatico')
    Score 30-59 → sugerencia (tipo: 'parcial', requiere confirmación)
    Score < 30  → sin match
    
    Threshold ajustables por configuración del estudio contable.
    """
    THRESHOLD_AUTO = 60
    THRESHOLD_PARTIAL = 30
    
    matches: list[ReconciliationMatchModel] = []
    used_voucher_ids: set[str] = set()
    updated_transactions = list(req.statement.transactions)

    for i, tx in enumerate(updated_transactions):
        if tx.status != 'pendiente':
            continue
        
        best_score = 0
        best_voucher = None
        best_criterios: list[str] = []
        
        for voucher in req.vouchers:
            if voucher.id in used_voucher_ids:
                continue
            if voucher.reconciliation_status != 'pendiente':
                continue
            
            score, criterios = score_match(tx, voucher)
            if score > best_score:
                best_score = score
                best_voucher = voucher
                best_criterios = criterios
        
        if best_voucher and best_score >= THRESHOLD_PARTIAL:
            tipo = 'automatico' if best_score >= THRESHOLD_AUTO else 'parcial'
            confidence_label = 'alta' if best_score >= 80 else 'media' if best_score >= 50 else 'baja'
            diferencia = round(tx.importe - best_voucher.total, 2)
            
            match = ReconciliationMatchModel(
                id=str(uuid.uuid4()),
                transaction_id=tx.id,
                voucher_ids=[best_voucher.id],
                tipo=tipo,
                confidence=confidence_label,
                confidence_score=min(best_score, 100),
                diferencia=diferencia,
                criterios=best_criterios,
                created_at=__import__('datetime').datetime.now().isoformat(),
                confirmed=tipo == 'automatico',
            )
            matches.append(match)
            used_voucher_ids.add(best_voucher.id)
            
            # Actualizar estado de la transacción en memoria
            updated_transactions[i] = tx.model_copy(update={
                'status': 'conciliado' if tipo == 'automatico' else 'parcial',
                'matched_voucher_ids': [best_voucher.id],
                'confidence': confidence_label,
                'confidence_score': min(best_score, 100),
            })

    # Recalcular statement
    updated_statement = req.statement.model_copy(update={'transactions': updated_transactions})
    stats = calc_stats(updated_transactions, matches)

    return {
        "statement": updated_statement,
        "matches": matches,
        "stats": stats,
    }


# ──────────────────────────────────────────────
# Endpoint 3: Reporte de Conciliación
# ──────────────────────────────────────────────

@router.post("/report")
async def generate_report(req: ReportRequest):
    """
    Genera un reporte de conciliación en Excel o PDF.
    Para Excel usamos openpyxl (si disponible).
    Para PDF usar reportlab o retornar HTML imprimible.
    
    NOTA: Implementación básica CSV por ahora. En producción
    usar openpyxl para Excel y WeasyPrint/reportlab para PDF.
    """
    # Reporte CSV básico como fallback
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        'Tipo', 'Fecha', 'Descripción', 'Importe', 'Estado', 'Comprobantes Conciliados'
    ])
    writer.writerow(['REPORTE DE CONCILIACIÓN BANCARIA — ComproScan AR'])
    writer.writerow([f'Cliente ID: {req.client_id}', f'Sesión: {req.session_id}'])
    writer.writerow([])
    
    content = output.getvalue().encode('utf-8-sig')
    
    filename = f"conciliacion_{req.client_id}_{__import__('datetime').date.today().isoformat()}.csv"
    
    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
