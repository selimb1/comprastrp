import io
from datetime import datetime

def generate_generic_csv(comprobantes: list[dict]) -> str:
    """
    Genera un CSV genérico muy útil para estudios de Excel y mapeos custom.
    """
    headers = [
        "Fecha", "Tipo_Comprobante", "Punto_Venta", "Numero", 
        "CUIT_Emisor", "Razon_Social", "Neto_21", "IVA_21", 
        "Exento", "Percepciones", "Total"
    ]
    
    output = io.StringIO()
    output.write(";".join(headers) + "\n")
    
    for c in comprobantes:
        importes = c.get('importes', {})
        
        percep_sum = sum([
            importes.get('percepcion_iva', 0.0),
            importes.get('percepcion_iibb', 0.0),
            importes.get('percepcion_ganancias', 0.0),
            importes.get('percepcion_suss', 0.0)
        ])
        
        row = [
            str(c.get('fecha_emision', '')),
            str(c.get('tipo_comprobante', '')),
            str(c.get('punto_venta', '')),
            str(c.get('numero_comprobante', '')),
            str(c.get('cuit_emisor', '')),
            str(c.get('razon_social_emisor', '')).replace(';', ''),
            f"{importes.get('neto_gravado_21', 0.0):.2f}".replace('.', ','),
            f"{importes.get('iva_21', 0.0):.2f}".replace('.', ','),
            f"{importes.get('exento', 0.0):.2f}".replace('.', ','),
            f"{percep_sum:.2f}".replace('.', ','),
            f"{importes.get('total', 0.0):.2f}".replace('.', ',')
        ]
        output.write(";".join(row) + "\n")
        
    return output.getvalue()

def generate_holistor_txt(comprobantes: list[dict]) -> str:
    """
    Formato Texto de ancho fijo para rg3685 CITI Compras o nativo Holistor.
    Registro Tipo 1 - Cabecera.
    """
    output = io.StringIO()
    
    for c in comprobantes:
        # Fecha: AAAAMMDD (8 chars)
        fecha_str = "00000000"
        try:
            fecha_obj = datetime.strptime(str(c.get('fecha_emision', '')), "%Y-%m-%d")
            fecha_str = fecha_obj.strftime("%Y%m%d")
        except:
            pass
        
        # Tipo comprobante: 3 chars
        codigo_afip = str(c.get('codigo_afip_sugerido') or 1).zfill(3)
        pv = str(c.get('punto_venta', '0')).zfill(5)
        num = str(c.get('numero_comprobante', '0')).zfill(20)
        cuit = str(c.get('cuit_emisor', '0')).zfill(11)
        nombre = str(c.get('razon_social_emisor', 'S/N'))[:30].ljust(30, ' ')
        
        # Totales (15 decimal implicito)
        importes = c.get('importes', {})
        total_centavos = int(float(importes.get('total', 0.0)) * 100)
        total_str = str(total_centavos).zfill(15)
        
        # Linea concatenada exacta sin separadores
        line = f"{fecha_str}{codigo_afip}{pv}{num}{cuit}{nombre}{total_str}"
        output.write(line + "\n")
        
    return output.getvalue()
