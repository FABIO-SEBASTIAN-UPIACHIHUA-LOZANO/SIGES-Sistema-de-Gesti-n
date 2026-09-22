import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import settings


def send_password_reset_code(recipient: str, code: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        raise RuntimeError("El servicio de correo no está configurado")

    message = EmailMessage()
    message["Subject"] = "Código para restablecer tu contraseña de SIGES"
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = recipient
    message.set_content(
        f"Tu código de recuperación de SIGES es: {code}\n\n"
        f"El código vence en {settings.PASSWORD_RESET_CODE_MINUTES} minutos.\n"
        "Si no solicitaste este cambio, ignora este mensaje."
    )
    message.add_alternative(
        f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0f172a">
          <h2 style="margin:0 0 12px">Recuperación de contraseña</h2>
          <p>Usa este código para restablecer tu contraseña de SIGES:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#eef2ff;color:#4f46e5;padding:18px;text-align:center;border-radius:12px">{code}</div>
          <p style="color:#64748b">El código vence en {settings.PASSWORD_RESET_CODE_MINUTES} minutos.</p>
          <p style="color:#64748b">Si no solicitaste este cambio, ignora este mensaje.</p>
        </div>
        """,
        subtype="html",
    )

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_USE_TLS:
            server.starttls(context=context)
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)
