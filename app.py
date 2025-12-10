from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from db_config import get_connection
from datetime import datetime, timedelta, date
from flask import make_response
from flask import send_file
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io
from datetime import datetime
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from io import BytesIO


app = Flask(__name__)
app.secret_key = "clave_super_secreta_kunnskap"   # cámbiala

# --------- RUTAS DE VISTAS (HTML) --------- #

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/admin")
def admin_panel():
    if "usuario" not in session:
        return redirect("/")
    return render_template("admin.html", rol=session["rol"])

@app.route("/api/admin/boleta/<int:pedido_id>")
def generar_boleta_pdf(pedido_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Datos del pago
    cursor.execute("""
        SELECT pagos.*, pedidos.cliente_nombre, pedidos.mesa, pedidos.total 
        FROM pagos 
        JOIN pedidos ON pedidos.id = pagos.pedido_id 
        WHERE pagos.pedido_id = %s
        ORDER BY pagos.id DESC LIMIT 1
    """, (pedido_id,))
    pago = cursor.fetchone()

    if not pago:
        return "Pago no encontrado", 404

    # Items del pedido
    cursor.execute("""
        SELECT nombre, cantidad, subtotal 
        FROM pedido_items 
        WHERE pedido_id = %s
    """, (pedido_id,))
    items = cursor.fetchall()

    from fpdf import FPDF
    pdf = FPDF("P", "mm", (80, 200))
    pdf.add_page()
    pdf.set_font("Arial", size=10)

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 5, "KUNNSKAP CAFETERIA", ln=True, align="C")

    pdf.set_font("Arial", size=9)
    pdf.cell(0, 5, f"Cliente: {pago['cliente_nombre']}", ln=True)
    pdf.cell(0, 5, f"Mesa: {pago['mesa']}", ln=True)
    pdf.cell(0, 5, f"Fecha: {pago['fecha_hora']}", ln=True)
    pdf.ln(3)

    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 5, "Detalle de consumo:", ln=True)

    pdf.set_font("Arial", size=9)
    for item in items:
        pdf.cell(0, 5, f"{item['cantidad']}x {item['nombre']}", ln=True)
        pdf.cell(0, 5, f"  Subtotal: S/ {item['subtotal']:.2f}", ln=True)

    pdf.ln(3)
    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 5, "Resumen:", ln=True)
    pdf.set_font("Arial", size=9)

    pdf.cell(0, 5, f"Método: {pago['metodo']}", ln=True)
    pdf.cell(0, 5, f"Total consumido: S/ {pago['total']:.2f}", ln=True)
    pdf.cell(0, 5, f"Total pagado: S/ {pago['monto']:.2f}", ln=True)

    pdf.ln(4)
    pdf.cell(0, 5, "Gracias por su compra!", ln=True, align="C")

    cursor.close()
    conn.close()

    return send_file(
        pdf.output(dest="S").encode("latin1"),
        mimetype="application/pdf",
        download_name=f"boleta_{pedido_id}.pdf"
    )



@app.route("/api/cierres/reporte-dia")
def api_reporte_del_dia():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            IFNULL(SUM(CASE WHEN metodo='efectivo' THEN monto END),0),
            IFNULL(SUM(CASE WHEN metodo='yape' THEN monto END),0),
            IFNULL(SUM(CASE WHEN metodo='tarjeta' THEN monto END),0)
        FROM pagos
        WHERE DATE(fecha) = DATE('now')
    """)

    ef, yp, tj = cur.fetchone()
    total = float(ef) + float(yp) + float(tj)

    conn.close()

    return {
        "ok": True,
        "resumen": {
            "efectivo": float(ef),
            "yape": float(yp),
            "tarjeta": float(tj)
        },
        "total": total
    }


# --------- API: LOGIN / LOGOUT --------- #

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json()
    usuario = data.get("usuario")
    clave = data.get("clave")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM usuarios WHERE usuario=%s AND clave=%s AND activo=1",
                   (usuario, clave))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({"ok": False, "msg": "Usuario o contraseña incorrectos"}), 401

    # ✔ Crear sesión
    session["usuario"] = user["usuario"]
    session["rol"] = user["rol"]

    return jsonify({
        "ok": True,
        "rol": user["rol"]
    })


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"ok": True})


# --------- API: MENU CLIENTE --------- #

@app.route("/api/menu", methods=["GET"])
def api_menu():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Traer productos disponibles
    cursor.execute("""
        SELECT id, nombre, categoria, precio
        FROM productos
        WHERE activo = 1
    """)
    productos = cursor.fetchall()

    productos_disponibles = []

    for prod in productos:
        # Receta por nombre
        cursor.execute("""
            SELECT rd.ingrediente_nombre, rd.cantidad, rd.unidad
            FROM recetario r
            JOIN recetario_detalle rd ON rd.recetario_id = r.id
            WHERE r.producto_nombre = %s
        """, (prod["nombre"],))

        receta = cursor.fetchall()

        if not receta:
            continue

        disponible = True

        for r in receta:
            # Buscar ingrediente por nombre
            cursor.execute("""
                SELECT stock_actual FROM ingredientes
                WHERE nombre = %s
            """, (r["ingrediente_nombre"],))
            ing = cursor.fetchone()

            if not ing:
                disponible = False
                break

            stock = ing["stock_actual"]
            cant = r["cantidad"]

            # Conversión simple unidades → base (g o ml)
            if r["unidad"] == "kg":
                cant *= 1000
            elif r["unidad"] == "l":
                cant *= 1000
            # g, ml, u quedan igual

            if stock < cant:
                disponible = False
                break

        if disponible:
            productos_disponibles.append(prod)

    cursor.close()
    conn.close()

    return jsonify(productos_disponibles)

# --------- API: REGISTRAR PEDIDO CLIENTE --------- #

@app.post("/api/admin/menu/agregar")
def api_agregar_menu():
    data = request.json
    nombre = data.get("nombre")

    # Verificar si ya existe en menú
    existe = db.execute("SELECT id FROM menu WHERE nombre = %s", (nombre,))
    if existe:
        return jsonify(ok=False, msg="El producto ya se encuentra en el menú.")

    db.execute("INSERT INTO menu (nombre) VALUES (%s)", (nombre,))
    return jsonify(ok=True)


@app.post("/api/admin/menu/quitar")
def api_quitar_menu():
    data = request.json
    nombre = data.get("nombre")

    existe = db.execute("SELECT id FROM menu WHERE nombre = %s", (nombre,))
    if not existe:
        return jsonify(ok=False, msg="El producto no está en el menú.")

    db.execute("DELETE FROM menu WHERE nombre = %s", (nombre,))
    return jsonify(ok=True)

@app.route("/api/cierres/lista")
def api_cierres_lista():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, fecha, total_general
        FROM cierres_diarios
        ORDER BY fecha DESC
    """)

    cierres = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify({"ok": True, "cierres": cierres})



@app.route("/api/cierres/print/<int:id>")
def api_cierre_print(id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT fecha, total_efectivo, total_yape, total_tarjeta, total_general
        FROM cierres_diarios WHERE id = ?
    """, (id,))

    r = cur.fetchone()
    conn.close()

    if not r:
        return "No encontrado", 404

    fecha, ef, yp, tj, total = r

    html = f"""
        <h2>CIERRE DE CAJA – {fecha}</h2>
        <p>Efectivo: S/ {ef:.2f}</p>
        <p>Yape: S/ {yp:.2f}</p>
        <p>Tarjeta: S/ {tj:.2f}</p>
        <h3>Total: S/ {total:.2f}</h3>
        <script>window.print()</script>
    """

    return html


@app.route("/api/pedidos", methods=["POST"])
def api_crear_pedido():
    data = request.get_json()
    cliente_nombre = data.get("cliente_nombre")
    mesa = data.get("mesa")
    items = data.get("items", [])  # [{producto_id, cantidad, precio}]

    if not cliente_nombre or not mesa or not items:
        return jsonify({"ok": False, "msg": "Datos incompletos"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    # calcular total
    total = sum([item["precio"] * item["cantidad"] for item in items])

    # insertar pedido
    cursor.execute("""
        INSERT INTO pedidos (cliente_nombre, mesa, total, estado)
        VALUES (%s, %s, %s, 'pendiente')
    """, (cliente_nombre, mesa, total))
    pedido_id = cursor.lastrowid

    # insertar detalle
    for item in items:
        cursor.execute("""
            INSERT INTO pedido_items (pedido_id, producto_id, cantidad, subtotal)
            VALUES (%s, %s, %s, %s)
        """, (
            pedido_id,
            item["producto_id"],
            item["cantidad"],
            item["precio"] * item["cantidad"]
        ))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"ok": True, "pedido_id": pedido_id})


# --------- API: PEDIDOS PARA ADMIN --------- #

@app.route("/api/admin/pedidos", methods=["GET"])
def api_admin_pedidos():
    """
    Lista pedidos no culminados para el panel admin.
    """
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id, p.cliente_nombre, p.mesa, p.estado, p.fecha_hora, p.total
        FROM pedidos p
        WHERE p.estado IN ('pendiente','en_proceso','listo')
        ORDER BY p.fecha_hora ASC
    """)
    pedidos = cursor.fetchall()

    # Traer items de cada pedido
    for ped in pedidos:
        cursor.execute("""
            SELECT pi.id, pi.producto_id, prod.nombre, pi.cantidad, pi.estado_item, pi.subtotal
            FROM pedido_items pi
            JOIN productos prod ON prod.id = pi.producto_id
            WHERE pi.pedido_id = %s
        """, (ped["id"],))
        ped["items"] = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({"ok": True, "pedidos": pedidos})

@app.route("/api/admin/ingredientes", methods=["GET"])
def api_listar_ingredientes():
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM ingredientes ORDER BY nombre ASC")
    ingredientes = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify({"ok": True, "ingredientes": ingredientes})

@app.route("/api/admin/ingredientes/add", methods=["POST"])
def api_agregar_ingrediente():
    data = request.get_json()
    nombre = data.get("nombre")
    unidad = data.get("unidad")
    stock_actual = data.get("stock_actual", 0)
    stock_minimo = data.get("stock_minimo", 0)

    if not nombre or not unidad:
        return jsonify({"ok": False, "msg": "Datos incompletos"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO ingredientes (nombre, unidad, stock_actual, stock_minimo)
        VALUES (%s, %s, %s, %s)
    """, (nombre, unidad, stock_actual, stock_minimo))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"ok": True, "msg": "Ingrediente agregado"})

@app.route("/api/admin/ingredientes/delete/<int:ing_id>", methods=["DELETE"])
def api_eliminar_ingrediente(ing_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ingredientes WHERE id = %s", (ing_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"ok": True, "msg": "Ingrediente eliminado"})

def descontar_ingredientes(item_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. Datos del item y producto
    cursor.execute("""
        SELECT pi.cantidad, pi.producto_id, p.nombre AS producto_nombre
        FROM pedido_items pi
        JOIN productos p ON p.id = pi.producto_id
        WHERE pi.id = %s
    """, (item_id,))
    item = cursor.fetchone()

    if not item:
        cursor.close()
        conn.close()
        return

    cant_item = item["cantidad"]
    producto_nombre = item["producto_nombre"]

    # 2. Buscar receta por nombre de producto
    cursor.execute("""
        SELECT id
        FROM recetario
        WHERE producto_nombre = %s
        LIMIT 1
    """, (producto_nombre,))
    rec = cursor.fetchone()

    if not rec:
        # No hay receta definida para este producto, no descuenta
        cursor.close()
        conn.close()
        return

    recetario_id = rec["id"]

    # 3. Ingredientes de la receta (por nombre de ingrediente)
    cursor.execute("""
        SELECT ingrediente_nombre, cantidad, unidad
        FROM recetario_detalle
        WHERE recetario_id = %s
    """, (recetario_id,))
    det = cursor.fetchall()

    # 4. Para cada ingrediente del recetario → buscar ingrediente real en tabla ingredientes y descontar
    for r in det:
        nombre_ing = r["ingrediente_nombre"]
        cant_receta = float(r["cantidad"])

        # cantidad total según número de items del pedido
        total_descontar = cant_receta * cant_item

        # buscar ingrediente por nombre
        cursor.execute("""
            SELECT id, stock_actual
            FROM ingredientes
            WHERE nombre = %s
            LIMIT 1
        """, (nombre_ing,))
        ing = cursor.fetchone()
        if not ing:
            # ingrediente no existe en inventario, se salta
            continue

        ing_id = ing["id"]

        cursor.execute("""
            UPDATE ingredientes
            SET stock_actual = stock_actual - %s
            WHERE id = %s
        """, (total_descontar, ing_id))

    conn.commit()
    cursor.close()
    conn.close()


# --------- API: ACTUALIZAR ESTADO DE UN ITEM --------- #
@app.route("/api/admin/pedido-item/<int:item_id>/estado", methods=["POST"])
def api_actualizar_estado_item(item_id):
    """
    Cambia el estado de un item (pendiente/en_preparacion/listo).
    Si el estado cambia a 'listo', descuenta los ingredientes automáticamente.
    """
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    data = request.get_json()
    nuevo_estado = data.get("estado_item")

    if nuevo_estado not in ["pendiente", "en_preparacion", "listo"]:
        return jsonify({"ok": False, "msg": "Estado inválido"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # --- 1. Verificar estado actual para evitar doble descuento ---
    cursor.execute("SELECT estado_item FROM pedido_items WHERE id = %s", (item_id,))
    item = cursor.fetchone()

    if not item:
        cursor.close()
        conn.close()
        return jsonify({"ok": False, "msg": "Item no existe"}), 404

    estado_actual = item["estado_item"]

    # --- 2. Actualizar estado ---
    cursor.execute("""
        UPDATE pedido_items
        SET estado_item = %s
        WHERE id = %s
    """, (nuevo_estado, item_id))
    
    conn.commit()

    # --- 3. Si pasa a 'listo' y antes NO estaba listo → descontar inventario ---
    if nuevo_estado == "listo" and estado_actual != "listo":
        try:
            descontar_ingredientes(item_id)
        except Exception as e:
            print("ERROR al descontar inventario:", e)
            cursor.close()
            conn.close()
            return jsonify({"ok": False, "msg": "Error al descontar inventario"}), 500

    cursor.close()
    conn.close()

    return jsonify({"ok": True, "msg": "Estado actualizado correctamente"})



# --------- API: MARCAR PEDIDO COMO CULMINADO --------- #

@app.route("/api/admin/pedido/<int:pedido_id>/culminar", methods=["POST"])
def api_culminar_pedido(pedido_id):
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Obtener pedido
    cursor.execute("SELECT * FROM pedidos WHERE id=%s", (pedido_id,))
    ped = cursor.fetchone()

    if not ped:
        return jsonify({"ok": False, "msg": "Pedido no existe"}), 404

    # 1. Actualizar estado del pedido
    cursor.execute("""
        UPDATE pedidos
        SET estado='culminado'
        WHERE id=%s
    """, (pedido_id,))

    # 2. Crear registro pendiente en PAGOS
    cursor.execute("""
        INSERT INTO pagos (pedido_id, estado, metodo, monto, recargo, comprobante_url)
        VALUES (%s, 'pendiente', 'efectivo', %s, 0, NULL)
    """, (pedido_id, ped["total"]))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"ok": True, "msg": "Pedido marcado como culminado"})



@app.route("/api/admin/ingredientes/update/<int:ing_id>", methods=["POST"])
def api_actualizar_ingrediente(ing_id):
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    data = request.get_json()
    nombre = data.get("nombre")
    unidad = data.get("unidad")
    # cantidad que se va a agregar al stock
    stock_a_sumar = float(data.get("stock_actual", 0) or 0)
    stock_minimo = float(data.get("stock_minimo", 0) or 0)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE ingredientes
        SET 
            nombre = %s,
            unidad = %s,
            stock_actual = stock_actual + %s,
            stock_minimo = %s
        WHERE id = %s
    """, (nombre, unidad, stock_a_sumar, stock_minimo, ing_id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"ok": True, "msg": "Ingrediente actualizado"})


@app.route("/api/admin/pagos/pendientes")
def api_pagos_pendientes():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # SOLO traer pedidos que NO han sido pagados
    cursor.execute("""
        SELECT id AS pedido_id, cliente_nombre, mesa, total
        FROM pedidos
        WHERE pagado = 0
        ORDER BY id DESC
    """)

    pendientes = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({"pendientes": pendientes})



@app.route("/api/admin/pagos/pagados")
def api_pagos_pagados():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT pagos.*, pedidos.cliente_nombre, pedidos.mesa
        FROM pagos
        JOIN pedidos ON pedidos.id = pagos.pedido_id
        WHERE pagos.estado = 'pagado'
        ORDER BY pagos.fecha_hora DESC
    """)

    pagados = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({"pagados": pagados})

@app.route("/api/admin/pagos/registrar", methods=["POST"])
def api_registrar_pago():
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False}), 401

    data = request.get_json()

    pedido_id = data.get("pedido_id")
    metodo = data.get("metodo")          # efectivo / yape / tarjeta
    dinero_entregado = float(data.get("monto") or 0)
    comprobante = data.get("comprobante_url")
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Obtener total real del pedido
    cursor.execute("SELECT total FROM pedidos WHERE id = %s", (pedido_id,))
    ped = cursor.fetchone()
    if not ped:
        return jsonify({"ok": False, "msg": "Pedido no encontrado"}), 404

    total_real = float(ped["total"])

    # --------------------------------------------
    # 1) PAGO EN EFECTIVO
    # --------------------------------------------
    if metodo == "efectivo":

        if dinero_entregado < total_real:
            return jsonify({"ok": False, "msg": "El monto entregado es insuficiente"}), 400

        vuelto = dinero_entregado - total_real
        monto_cobrado = total_real  # lo que se registra en BD

        recargo = 0

    # --------------------------------------------
    # 2) PAGO CON YAPE
    # --------------------------------------------
    elif metodo == "yape":

        # en yape NO se acepta monto mayor NI menor
        if dinero_entregado != 0 and dinero_entregado != total_real:
            return jsonify({"ok": False, "msg": "En Yape el monto debe ser exacto"}), 400

        monto_cobrado = total_real
        vuelto = 0
        recargo = 0

    # --------------------------------------------
    # 3) PAGO CON TARJETA
    # --------------------------------------------
    elif metodo == "tarjeta":

        if total_real > 20:
            recargo = round(total_real * 0.03, 2)
        else:
            recargo = 0

        total_con_recargo = total_real + recargo

        # monto debe ser EXACTO
        if dinero_entregado != 0 and dinero_entregado != total_con_recargo:
            return jsonify({"ok": False,
                            "msg": f"El pago con tarjeta debe ser exactamente S/ {total_con_recargo:.2f}"}), 400

        monto_cobrado = total_con_recargo
        vuelto = 0

    else:
        return jsonify({"ok": False, "msg": "Método inválido"}), 400

    # --------------------------------------------
    # REGISTRO EN BD
    # Guarda solo los valores correctos
    # --------------------------------------------
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE pagos 
        SET metodo = %s,
            monto = %s,
            vuelto = %s,
            recargo = %s,
            comprobante_url = %s,
            fecha_hora = CONVERT_TZ(NOW(), @@global.time_zone, '-05:00'),
            estado = 'pagado'
        WHERE pedido_id = %s AND estado = 'pendiente'
        LIMIT 1
    """, (metodo, monto_cobrado, vuelto, recargo, comprobante, pedido_id))

    cursor.execute("UPDATE pedidos SET pagado = 1 WHERE id = %s", (pedido_id,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"ok": True, "msg": "Pago registrado correctamente"})

@app.route("/api/admin/reportes/cierre", methods=["POST"])
def api_generar_cierre_diario():
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False}), 401

    hoy = datetime.now().date()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Evitar doble cierre
    cursor.execute("SELECT * FROM cierres_diarios WHERE fecha=%s", (hoy,))
    if cursor.fetchone():
        return jsonify({"ok": False, "msg": "El cierre de hoy ya fue realizado"})

    # Obtener pagos del día
    cursor.execute("""
        SELECT metodo, SUM(monto) AS total, COUNT(*) AS cantidad
        FROM pagos
        WHERE DATE(fecha_hora) = %s AND estado='pagado'
        GROUP BY metodo
    """, (hoy,))

    pagos = cursor.fetchall()

    tot_efectivo = tot_yape = tot_tarjeta = 0
    cnt_efec = cnt_yape = cnt_tarj = 0

    for p in pagos:
        if p["metodo"] == "efectivo":
            tot_efectivo = p["total"]; cnt_efec = p["cantidad"]
        elif p["metodo"] == "yape":
            tot_yape = p["total"]; cnt_yape = p["cantidad"]
        elif p["metodo"] == "tarjeta":
            tot_tarjeta = p["total"]; cnt_tarj = p["cantidad"]

    total_general = tot_efectivo + tot_yape + tot_tarjeta
    cant_total = cnt_efec + cnt_yape + cnt_tarj

    # Guardar cierre
    cursor.execute("""
        INSERT INTO cierres_diarios
        (fecha, total_efectivo, total_yape, total_tarjeta, total_general)
        VALUES (%s, %s, %s, %s, %s)
    """, (hoy, tot_efectivo, tot_yape, tot_tarjeta, total_general))

    conn.commit()
    cursor.close()
    conn.close()

    # -------- GENERAR PDF TÉRMICO (80mm) -------- #
    buffer = io.BytesIO()

    # Tamaño ticket 80mm → ancho 226 puntos
    TICKET_WIDTH = 226
    pdf = canvas.Canvas(buffer, pagesize=(TICKET_WIDTH, 500))  

    y = 480

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawCentredString(TICKET_WIDTH/2, y, "CAFETERÍA KUNNSKAP")
    y -= 20

    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(TICKET_WIDTH/2, y, "Cierre de Caja")
    y -= 15

    pdf.drawCentredString(TICKET_WIDTH/2, y, f"Fecha: {hoy}")
    y -= 25

    pdf.line(10, y, TICKET_WIDTH-10, y)
    y -= 20

    pdf.setFont("Helvetica", 9)
    pdf.drawString(10, y, f"Efectivo ({cnt_efec}):")
    pdf.drawRightString(TICKET_WIDTH-10, y, f"S/ {tot_efectivo:.2f}")
    y -= 15

    pdf.drawString(10, y, f"Yape ({cnt_yape}):")
    pdf.drawRightString(TICKET_WIDTH-10, y, f"S/ {tot_yape:.2f}")
    y -= 15

    pdf.drawString(10, y, f"Tarjeta ({cnt_tarj}):")
    pdf.drawRightString(TICKET_WIDTH-10, y, f"S/ {tot_tarjeta:.2f}")
    y -= 20

    pdf.line(10, y, TICKET_WIDTH-10, y)
    y -= 20

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(10, y, "TOTAL DEL DÍA:")
    pdf.drawRightString(TICKET_WIDTH-10, y, f"S/ {total_general:.2f}")
    y -= 20

    pdf.setFont("Helvetica", 9)
    pdf.drawString(10, y, f"Pagos procesados: {cant_total}")
    y -= 20

    pdf.drawCentredString(TICKET_WIDTH/2, y, "Gracias por su trabajo")
    y -= 10
    pdf.drawCentredString(TICKET_WIDTH/2, y, "KUNNSKAP SYSTEMS")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"Cierre_{hoy}.pdf",
        mimetype="application/pdf"
    )



@app.route("/api/admin/reportes/diario")
def api_reporte_diario():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            IFNULL(SUM(CASE WHEN metodo='efectivo' THEN monto END),0) AS total_efectivo,
            IFNULL(SUM(CASE WHEN metodo='yape' THEN monto END),0) AS total_yape,
            IFNULL(SUM(CASE WHEN metodo='tarjeta' THEN monto END),0) AS total_tarjeta
        FROM pagos
        WHERE DATE(fecha_hora) = CURDATE()
        AND estado='pagado'
    """)
    
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    total_general = (
        row["total_efectivo"] +
        row["total_yape"] +
        row["total_tarjeta"]
    )

    return jsonify({
        "ok": True,
        "data": {
            "fecha": str(date.today()),
            "total_efectivo": row["total_efectivo"],
            "total_yape": row["total_yape"],
            "total_tarjeta": row["total_tarjeta"],
            "total_general": total_general
        }
    })



@app.route("/api/admin/reportes/semanal")
def api_reporte_semanal():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Inicio de semana (lunes)
    cursor.execute("SELECT DATE_SUB(CURDATE(), INTERVAL (WEEKDAY(CURDATE())) DAY) AS inicio")
    inicio_semana = cursor.fetchone()["inicio"]

    cursor.execute("""
        SELECT 
            DATE(fecha_hora) AS fecha,
            IFNULL(SUM(CASE WHEN metodo='efectivo' THEN monto END),0) AS total_efectivo,
            IFNULL(SUM(CASE WHEN metodo='yape' THEN monto END),0) AS total_yape,
            IFNULL(SUM(CASE WHEN metodo='tarjeta' THEN monto END),0) AS total_tarjeta
        FROM pagos
        WHERE fecha_hora >= %s
        AND estado = 'pagado'
        GROUP BY DATE(fecha_hora)
        ORDER BY fecha
    """, (inicio_semana,))

    dias = cursor.fetchall()
    cursor.close()
    conn.close()

    # Calcular total diario
    for d in dias:
        d["total_general"] = (
            d["total_efectivo"] +
            d["total_yape"] +
            d["total_tarjeta"]
        )

    return jsonify({"ok": True, "dias": dias})



@app.route("/api/admin/factura/<int:pedido_id>", methods=["POST"])
def api_factura(pedido_id):
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False}), 401

    data = request.get_json()
    razon = data.get("razon_social")
    ruc = data.get("ruc")
    direccion = data.get("direccion")

    if not razon or not ruc:
        return jsonify({"ok": False, "msg": "Datos incompletos"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Obtener pedido
    cursor.execute("SELECT * FROM pedidos WHERE id = %s", (pedido_id,))
    pedido = cursor.fetchone()

    # items
    cursor.execute("""
        SELECT prod.nombre, pi.cantidad, pi.subtotal 
        FROM pedido_items pi
        JOIN productos prod ON prod.id = pi.producto_id
        WHERE pi.pedido_id = %s
    """, (pedido_id,))
    items = cursor.fetchall()

    cursor.close()
    conn.close()

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle(f"Factura_{pedido_id}")

    # Header
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(200, 750, "CAFETERÍA KUNNSKAP")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(230, 735, "RUC: 12345678901")

    # Título
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, 700, f"FACTURA - #{pedido_id}")

    # Datos cliente empresa
    pdf.setFont("Helvetica", 10)
    pdf.drawString(50, 680, f"Razón Social: {razon}")
    pdf.drawString(50, 665, f"RUC: {ruc}")
    pdf.drawString(50, 650, f"Dirección: {direccion}")

    # Datos pedido
    pdf.drawString(50, 630, f"Cliente Mesa: {pedido['cliente_nombre']} (Mesa {pedido['mesa']})")

    # Tabla
    y = 600
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(50, y, "Producto")
    pdf.drawString(250, y, "Cantidad")
    pdf.drawString(350, y, "Subtotal")

    pdf.line(45, y-5, 560, y-5)
    pdf.setFont("Helvetica", 10)
    y -= 25

    total = 0
    for item in items:
        pdf.drawString(50, y, item["nombre"])
        pdf.drawString(260, y, str(item["cantidad"]))
        pdf.drawString(360, y, f"S/ {item['subtotal']:.2f}")
        total += item["subtotal"]
        y -= 20

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, y - 20, f"TOTAL: S/ {total:.2f}")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"Factura_{pedido_id}.pdf",
        mimetype="application/pdf"
    )

@app.route("/api/admin/dashboard/resumen", methods=["GET"])
def api_dashboard_resumen():
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    hoy = datetime.now().date()
    inicio_semana = hoy - timedelta(days=hoy.weekday())  # lunes
    inicio_mes = date(hoy.year, hoy.month, 1)

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Ventas HOY
    cursor.execute("""
        SELECT COALESCE(SUM(monto),0) AS total_hoy
        FROM pagos
        WHERE DATE(fecha_hora) = %s AND estado = 'pagado'
    """, (hoy,))
    ventas_hoy = cursor.fetchone()["total_hoy"]

    # Ventas SEMANA
    cursor.execute("""
        SELECT COALESCE(SUM(monto),0) AS total_semana
        FROM pagos
        WHERE DATE(fecha_hora) BETWEEN %s AND %s AND estado = 'pagado'
    """, (inicio_semana, hoy))
    ventas_semana = cursor.fetchone()["total_semana"]

    # Ventas MES
    cursor.execute("""
        SELECT COALESCE(SUM(monto),0) AS total_mes
        FROM pagos
        WHERE DATE(fecha_hora) BETWEEN %s AND %s AND estado = 'pagado'
    """, (inicio_mes, hoy))
    ventas_mes = cursor.fetchone()["total_mes"]

    # Pedidos activos (en curso)
    cursor.execute("""
        SELECT COUNT(*) AS cant
        FROM pedidos
        WHERE estado IN ('pendiente','en_proceso','listo')
    """)
    pedidos_activos = cursor.fetchone()["cant"]

    # Pagos pendientes (pedidos culminados pero no pagados)
    cursor.execute("""
        SELECT COUNT(*) AS cant
        FROM pedidos
        WHERE estado = 'culminado' AND pagado = 0
    """)
    pagos_pendientes = cursor.fetchone()["cant"]

    conn.close()

    return jsonify({
        "ok": True,
        "resumen": {
            "ventas_hoy": float(ventas_hoy),
            "ventas_semana": float(ventas_semana),
            "ventas_mes": float(ventas_mes),
            "pedidos_activos": int(pedidos_activos),
            "pagos_pendientes": int(pagos_pendientes)
        }
    })

@app.route("/api/admin/dashboard/top-productos", methods=["GET"])
def api_dashboard_top_productos():
    if "usuario" not in session or session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Tomamos solo pedidos pagados
    cursor.execute("""
        SELECT prod.nombre,
               SUM(pi.cantidad) AS total_cantidad,
               SUM(pi.subtotal) AS total_ventas
        FROM pedido_items pi
        JOIN pedidos p ON p.id = pi.pedido_id
        JOIN productos prod ON prod.id = pi.producto_id
        WHERE p.pagado = 1
        GROUP BY prod.id, prod.nombre
        ORDER BY total_cantidad DESC
        LIMIT 5
    """)
    top = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({"ok": True, "top": top})

@app.route("/api/admin/usuarios/add", methods=["POST"])
def api_agregar_usuario():
    if session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    data = request.get_json()
    usuario = data["usuario"]
    clave = data["clave"]
    rol = data["rol"]

    if rol not in ["admin", "mesero", "caja"]:
        return jsonify({"ok": False, "msg": "Rol inválido"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO usuarios (usuario, clave, rol, activo)
        VALUES (%s, %s, %s, 1)
    """, (usuario, clave, rol))
    conn.commit()
    return jsonify({"ok": True, "msg": "Usuario registrado"})


@app.route("/api/admin/usuarios/update/<int:user_id>", methods=["POST"])
def api_update_usuario(user_id):
    if session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    data = request.get_json()
    rol = data["rol"]
    activo = data["activo"]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE usuarios SET rol=%s, activo=%s WHERE id=%s
    """, (rol, activo, user_id))

    conn.commit()
    return jsonify({"ok": True, "msg": "Usuario actualizado"})

@app.route("/api/admin/usuarios", methods=["GET"])
def api_listar_usuarios():
    if session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, usuario, rol, activo FROM usuarios")
    data = cursor.fetchall()
    return jsonify({"ok": True, "usuarios": data})

@app.route("/api/admin/recetario", methods=["GET"])
def api_recetario_listar():
    if session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT r.id, r.producto_nombre, r.descripcion,
               COUNT(d.id) AS total_ingredientes
        FROM recetario r
        LEFT JOIN recetario_detalle d ON d.recetario_id = r.id
        GROUP BY r.id, r.producto_nombre, r.descripcion
        ORDER BY r.producto_nombre ASC
    """)
    recetas = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({"ok": True, "recetas": recetas})

@app.route("/api/admin/recetario/<int:receta_id>", methods=["GET"])
def api_recetario_detalle(receta_id):
    if session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM recetario WHERE id = %s", (receta_id,))
    receta = cursor.fetchone()
    if not receta:
        cursor.close()
        conn.close()
        return jsonify({"ok": False, "msg": "Receta no encontrada"}), 404

    cursor.execute("""
        SELECT id, ingrediente_nombre, cantidad, unidad
        FROM recetario_detalle
        WHERE recetario_id = %s
        ORDER BY id ASC
    """, (receta_id,))
    ingredientes = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({"ok": True, "receta": receta, "ingredientes": ingredientes})

@app.route("/api/admin/recetario/save", methods=["POST"])
def api_recetario_save():
    if session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    data = request.get_json()
    receta_id = data.get("id")           # puede ser None
    producto_nombre = data.get("producto_nombre")
    descripcion = data.get("descripcion", "")
    ingredientes = data.get("ingredientes", [])

    if not producto_nombre or not ingredientes:
        return jsonify({"ok": False, "msg": "Nombre de producto e ingredientes son requeridos"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    # CREAR
    if not receta_id:
        cursor.execute("""
            INSERT INTO recetario (producto_nombre, descripcion)
            VALUES (%s, %s)
        """, (producto_nombre, descripcion))
        receta_id = cursor.lastrowid
    else:
        # EDITAR CABECERA
        cursor.execute("""
            UPDATE recetario
            SET producto_nombre = %s, descripcion = %s
            WHERE id = %s
        """, (producto_nombre, descripcion, receta_id))
        # limpiar ingredientes antiguos
        cursor.execute("DELETE FROM recetario_detalle WHERE recetario_id = %s", (receta_id,))

    # insertar nuevos ingredientes
    for ing in ingredientes:
        nombre_ing = ing.get("ingrediente_nombre")
        cantidad = float(ing.get("cantidad", 0) or 0)
        unidad = ing.get("unidad")

        if not nombre_ing or cantidad <= 0 or unidad not in ["g", "kg", "ml", "l", "u"]:
            continue

        cursor.execute("""
            INSERT INTO recetario_detalle (recetario_id, ingrediente_nombre, cantidad, unidad)
            VALUES (%s, %s, %s, %s)
        """, (receta_id, nombre_ing, cantidad, unidad))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"ok": True, "msg": "Receta guardada correctamente", "id": receta_id})

@app.route("/api/admin/recetario/delete/<int:receta_id>", methods=["DELETE"])
def api_recetario_delete(receta_id):
    if session.get("rol") != "admin":
        return jsonify({"ok": False, "msg": "No autorizado"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM recetario WHERE id = %s", (receta_id,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"ok": True, "msg": "Receta eliminada"})


if __name__ == "__main__":
    app.run()
