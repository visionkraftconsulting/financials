from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from datetime import datetime

def generate_invoice(filename):
    c = canvas.Canvas(filename, pagesize=LETTER)
    width, height = LETTER

    # Margins
    margin = 50
    y = height - margin

    # Header
    c.setFont("Helvetica-Bold", 20)
    c.drawString(margin, y, "Invoice")
    c.setFont("Helvetica-Bold", 18)
    c.drawRightString(width - margin, y, "Hearts United Homecare")

    # Invoice Meta
    y -= 40
    c.setFont("Helvetica", 10)
    c.drawString(margin, y, "Invoice number:")
    c.drawString(margin + 100, y, "N7GNYT03")
    c.drawString(margin + 250, y, "Date due:")
    c.drawString(margin + 310, y, "July 6, 2025")
    c.drawString(margin + 400, y, "Due on receipt")

    # Company and Bill To
    y -= 30
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, "Hearts United Homecare")
    c.setFont("Helvetica", 10)
    c.drawString(margin, y - 15, "10202 Pacific Hwy S")
    c.drawString(margin, y - 30, "Suite 209")
    c.drawString(margin, y - 45, "Tacoma, Washington 98444")
    c.drawString(margin, y - 60, "United States")
    c.drawString(margin, y - 75, "+1 253-500-4746")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin + 300, y, "Bill to")
    c.setFont("Helvetica", 10)
    c.drawString(margin + 300, y - 15, "Gary K Richard")
    c.drawString(margin + 300, y - 30, "+1 206-403-0637")
    c.drawString(margin + 300, y - 45, "arykrichard@comcast.net")

    # Amount Due
    y -= 100
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin, y, "$3,780.00 USD due July 6, 2025")
    y -= 20

    # Table Headers
    y -= 30
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin, y, "Description")
    c.drawString(margin + 300, y, "Hours")
    c.drawString(margin + 350, y, "Unit price")
    c.drawString(margin + 430, y, "Amount")

    # Table Content
    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(margin, y, "7 days a week 8pm to 8am - Client: Janet Richard")
    c.drawString(margin + 300, y, "84")
    c.drawString(margin + 350, y, "$45.00")
    c.drawString(margin + 430, y, "$3,780.00")

    # Totals
    y -= 40
    c.drawString(margin + 350, y, "Subtotal")
    c.drawRightString(width - margin, y, "$3,780.00")
    y -= 15
    c.drawString(margin + 350, y, "Total")
    c.drawRightString(width - margin, y, "$3,780.00")
    y -= 15
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin + 350, y, "Amount due")
    c.drawRightString(width - margin, y, "$3,780.00 USD")

    # Notes
    y -= 40
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin, y, "NOTE: DEPOSIT IS REFUNDABLE AND WILL BE APPLIED TO THE LAST WEEK OF CARE.")

    # RBC Payment Contact
    y -= 30
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, "Payment Advisor - RBC Health Management")
    c.setFont("Helvetica", 10)
    c.drawString(margin, y - 15, "Advisor: Johanna Vanscoy")
    c.drawString(margin, y - 30, "Phone: 425-712-7307")
    c.drawString(margin, y - 45, "Email: Johanna.vanscoy@rbc.com")

    # Bank Transfer Details
    y -= 60
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, "Bank Transfer / ACH / Wire Payment Details:")
    c.setFont("Helvetica", 10)
    c.drawString(margin, y - 15, "Account Number: 609055069")
    c.drawString(margin, y - 30, "Routing Number: 325070760")
    c.drawString(margin, y - 45, "Account Name: Hearts United Homecare")

    # Footer
    c.setFont("Helvetica", 8)
    c.drawString(margin, 30, "N7GNYT03 - $3,780.00 USD due on receipt")

    c.save()

# Run to generate the invoice
generate_invoice("invoice_n7gnyt03_full.pdf")