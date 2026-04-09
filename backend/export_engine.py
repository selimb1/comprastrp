import io
from datetime import datetime

# Mapeo de tipos de comprobante a códigos AFIP (RG 3685 CITI Compras)
CODIGO_TIPO_MAP = {
    1:  "Factura A",
    2:  "Nota Débito A",
    3:  "Nota Crédito A",
    4:  "Recibo A",
    5:  "Nota Venta Crédito A",
    6:  "Factura B",
    7:  "Nota Débito B",
    8:  "Nota Crédito B",
    9:  "Recibo B",
    10: "Nota Venta Crédito B",
    11: "Factura C",
    12: "Nota Débito C",
    13: "Nota Crédito C",
    15: "Factura T",
    19: "Factura E",
    51: "Factura M",
    52: "Nota Débito M",
    53: "Nota Crédito M",
    63: "Liquidación A",
    64: "Liquidación B",
    81: "Ticket Factura A",
    82: "Ticket Factura B",
    83: "Ticket Factura C",
    89: "Ticket / Comp. Fiscal",
    91: "Remito R",
    110: "Factura Importación",
    111: "Despacho Importación",
}

def _fmt_importe(valor: float, decimales: int = 2, ancho: int = 15) -> str:
    """Formatea un importe como entero de centavos, relleno con ceros a la izquierda."""
    centavos = int(round(float(valor or 0) * (10 ** decimales)))
    return str(abs(centavos)).zfill(ancho)

def _clean_cuit(cuit: str) -> str:
    """Elimina guiones y espacios del CUIT, devuelve 11 dígitos."""
    return ''.join(c for c in str(cuit or '0') if c.isdigit()).zfill(11)

def _fmt_str(valor: str, ancho: int, fill: str = ' ', align: str = 'left') -> str:
    """Ajusta una cadena al ancho especificado, recortando si es necesario."""
    s = str(valor or '').strip()[:ancho]
    if align == 'right':
        return s.rjust(ancho, fill)
    return s.ljust(ancho, fill)


def __escape_csv_injection(val_str: str) -> str:
    """Previene ejecución de fórmulas en Excel al abrir CSV."""
    if not val_str: return ""
    s = str(val_str).replace(';', ' ').replace('\n', ' ').strip()
    if s and (s[0] in ['=', '+', '-', '@', '\t', '\r']):
        return f"'{s}" 
    return s

def generate_generic_csv(comprobantes: list[dict]) -> str:
    """
    Genera un CSV genérico separado por punto y coma, compatible con Excel argentino.
    Incluye todos los campos de importes para máxima trazabilidad.
    """
    headers = [
        "Fecha", "Tipo_Doc", "Tipo_Comprobante", "Codigo_AFIP",
        "Punto_Venta", "Numero", "CUIT_Emisor", "Razon_Social",
        "Neto_21", "IVA_21", "Neto_105", "IVA_105", "Neto_27", "IVA_27",
        "Exento", "No_Gravado",
        "Perc_IVA", "Perc_IIBB", "Perc_Ganancias", "Perc_SUSS",
        "Total", "CAE"
    ]

    output = io.StringIO()
    output.write(";".join(headers) + "\n")

    for c in comprobantes:
        importes = c.get('importes', {})

        def fmt(v): return f"{float(v or 0):.2f}".replace('.', ',')

        row = [
            str(c.get('fecha_emision', '')),
            str(c.get('tipo_documento', 'factura')),
            str(c.get('tipo_comprobante', '')),
            str(c.get('codigo_afip_sugerido', '')),
            str(c.get('punto_venta', '')),
            str(c.get('numero_comprobante', '')),
            _clean_cuit(c.get('cuit_emisor', '')),
            __escape_csv_injection(c.get('razon_social_emisor', 'S/N')),
            fmt(importes.get('neto_gravado_21', 0)),
            fmt(importes.get('iva_21', 0)),
            fmt(importes.get('neto_gravado_105', 0)),
            fmt(importes.get('iva_105', 0)),
            fmt(importes.get('neto_gravado_27', 0)),
            fmt(importes.get('iva_27', 0)),
            fmt(importes.get('exento', 0)),
            fmt(importes.get('no_gravado', 0)),
            fmt(importes.get('percepcion_iva', 0)),
            fmt(importes.get('percepcion_iibb', 0)),
            fmt(importes.get('percepcion_ganancias', 0)),
            fmt(importes.get('percepcion_suss', 0)),
            fmt(importes.get('total', 0)),
            str(c.get('cae', '') or ''),
        ]
        output.write(";".join(row) + "\n")

    return output.getvalue()


def generate_holistor_txt(comprobantes: list[dict]) -> str:
    """
    Genera el archivo de texto de ancho fijo compatible con Holistor para importación de compras.
    
    Formato Holistor Compras (basado en CITI Compras RG 3685 - Registro Tipo 1):
    
    Pos   Long  Campo
    1-8    8    Fecha (AAAAMMDD)
    9-11   3    Tipo de Comprobante (código AFIP, ej: 001, 006, 011, 089)
    12-16  5    Punto de Venta (00001)
    17-36 20    Número de Comprobante (00000000000012345678)
    37-47 11    CUIT del Proveedor
    48-77 30    Razón Social del Proveedor
    78-92 15    Importe Total (decimal implícito 2 decimales, en centavos)
    93-107 15   Importe Neto Gravado 21% (centavos)
    108-122 15  Importe IVA 21% (centavos)
    123-137 15  Importe Neto Gravado 10.5% (centavos)
    138-152 15  Importe IVA 10.5% (centavos)
    153-167 15  Importe Neto Gravado 27% (centavos)
    168-182 15  Importe IVA 27% (centavos)
    183-197 15  Importe Exento (centavos)
    198-212 15  Importe No Gravado (centavos)
    213-227 15  Percepciones IVA (centavos)
    228-242 15  Percepciones IIBB (centavos)
    243-257 15  Percepciones Ganancias (centavos)
    258-272 15  Percepciones SUSS (centavos)
    """
    output = io.StringIO()

    for c in comprobantes:
        importes = c.get('importes', {})

        # --- 1. FECHA (8 chars) ---
        fecha_str = "00000000"
        try:
            fecha_obj = datetime.strptime(str(c.get('fecha_emision', '')), "%Y-%m-%d")
            fecha_str = fecha_obj.strftime("%Y%m%d")
        except Exception:
            pass

        # --- 2. CÓDIGO AFIP (3 chars) ---
        codigo_afip_raw = str(c.get('codigo_afip_sugerido', '')).strip()
        if not codigo_afip_raw or not codigo_afip_raw.isdigit():
            # Inferir por tipo de documento si no viene
            tipo_doc = str(c.get('tipo_documento', 'factura')).lower()
            tipo_comp = str(c.get('tipo_comprobante', '')).upper().strip()
            if tipo_doc in ('ticket_fiscal', 'ticket_combustible'):
                codigo_afip_raw = '89'
            elif tipo_doc == 'ticket_factura':
                tf_map = {'A': '81', 'B': '82', 'C': '83'}
                codigo_afip_raw = tf_map.get(tipo_comp, '89')
            else:
                fa_map = {'A': '1', 'B': '6', 'C': '11', 'M': '51', 'E': '19', 'T': '15'}
                codigo_afip_raw = fa_map.get(tipo_comp, '6')
        try:
            codigo_afip = str(int(codigo_afip_raw)).zfill(3)
        except ValueError:
            codigo_afip = "006"

        # --- 3. PUNTO DE VENTA (5 chars) ---
        pv_raw = str(c.get('punto_venta', '0')).strip()
        # Limpiar si viene con guión
        pv_raw = pv_raw.split('-')[0].strip()
        pv = ''.join(filter(str.isdigit, pv_raw)).zfill(5)[:5]

        # --- 4. NÚMERO COMPROBANTE (20 chars) ---
        num_raw = str(c.get('numero_comprobante', '0')).strip()
        num = ''.join(filter(str.isdigit, num_raw)).zfill(20)[:20]

        # --- 5. CUIT (11 chars) ---
        cuit = _clean_cuit(c.get('cuit_emisor', '0'))[:11]

        # --- 6. RAZÓN SOCIAL (30 chars, relleno espacios) ---
        nombre = _fmt_str(c.get('razon_social_emisor', 'S/N'), 30)

        # --- 7-18. IMPORTES (15 chars cada uno, decimal implícito 2) ---
        total          = _fmt_importe(importes.get('total', 0))
        neto_21        = _fmt_importe(importes.get('neto_gravado_21', 0))
        iva_21         = _fmt_importe(importes.get('iva_21', 0))
        neto_105       = _fmt_importe(importes.get('neto_gravado_105', 0))
        iva_105        = _fmt_importe(importes.get('iva_105', 0))
        neto_27        = _fmt_importe(importes.get('neto_gravado_27', 0))
        iva_27         = _fmt_importe(importes.get('iva_27', 0))
        exento         = _fmt_importe(importes.get('exento', 0))
        no_gravado     = _fmt_importe(importes.get('no_gravado', 0))
        perc_iva       = _fmt_importe(importes.get('percepcion_iva', 0))
        perc_iibb      = _fmt_importe(importes.get('percepcion_iibb', 0))
        perc_gcias     = _fmt_importe(importes.get('percepcion_ganancias', 0))
        perc_suss      = _fmt_importe(importes.get('percepcion_suss', 0))

        # Construir línea de ancho fijo
        line = (
            fecha_str   # 8
            + codigo_afip  # 3
            + pv           # 5
            + num          # 20
            + cuit         # 11
            + nombre       # 30
            + total        # 15
            + neto_21      # 15
            + iva_21       # 15
            + neto_105     # 15
            + iva_105      # 15
            + neto_27      # 15
            + iva_27       # 15
            + exento       # 15
            + no_gravado   # 15
            + perc_iva     # 15
            + perc_iibb    # 15
            + perc_gcias   # 15
            + perc_suss    # 15
        )
        output.write(line + "\r\n")  # CRLF para máxima compatibilidad con Windows/Holistor

    return output.getvalue()
