"""
Invoice generation utilities for creating PDF receipts and invoices
"""
from io import BytesIO
from datetime import datetime
from django.http import FileResponse
import os


def generate_invoice_html(order):
    """Generate HTML invoice content"""
    order_items_html = ""
    total_items_price = 0
    
    for item in order.orderitems.all():
        item_total = item.price * item.qty
        total_items_price += item_total
        order_items_html += f"""
        <tr>
            <td>{item.name}</td>
            <td style="text-align: center;">{item.qty}</td>
            <td style="text-align: right;">${item.price:.2f}</td>
            <td style="text-align: right;">${item_total:.2f}</td>
        </tr>
        """
    
    shipping_address = order.shippingaddress
    paid_badge = '<span style="color: #28a745; font-weight: bold;">✓ PAID</span>' if order.isPaid else '<span style="color: #dc3545; font-weight: bold;">UNPAID</span>'
    delivered_badge = '<span style="color: #28a745; font-weight: bold;">✓ DELIVERED</span>' if order.isDelivered else '<span style="color: #ffc107; font-weight: bold;">IN TRANSIT</span>'
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: 'Arial', sans-serif; background: white; color: #333; line-height: 1.6; }}
            .container {{ max-width: 800px; margin: 0 auto; padding: 40px; }}
            .header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }}
            .logo {{ font-size: 28px; font-weight: bold; color: #007bff; }}
            .invoice-title {{ font-size: 24px; font-weight: bold; }}
            .invoice-number {{ color: #666; margin-top: 5px; }}
            .section {{ margin-bottom: 30px; }}
            .section-title {{ font-size: 12px; font-weight: bold; color: #555; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px; }}
            .section-content {{ margin-bottom: 20px; }}
            .info-row {{ display: flex; margin-bottom: 8px; }}
            .info-label {{ width: 150px; font-weight: bold; color: #555; }}
            .info-value {{ flex: 1; color: #333; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th {{ background-color: #f8f9fa; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #dee2e6; }}
            td {{ padding: 12px; border-bottom: 1px solid #dee2e6; }}
            .total-section {{ display: flex; justify-content: flex-end; margin: 30px 0; }}
            .total-table {{ width: 300px; }}
            .total-table tr td {{ padding: 10px; }}
            .total-table .total-row {{ font-weight: bold; font-size: 18px; border-top: 2px solid #333; }}
            .total-table .total-row td {{ padding: 15px 10px; }}
            .footer {{ text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }}
            .status-badge {{ display: inline-block; padding: 8px 12px; border-radius: 4px; margin-right: 10px; font-size: 12px; font-weight: bold; }}
            .paid-badge {{ background-color: #d4edda; color: #155724; }}
            .unpaid-badge {{ background-color: #f8d7da; color: #721c24; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div>
                    <div class="logo">mamigloexclusive</div>
                    <div class="invoice-number">E-Commerce Platform</div>
                </div>
                <div style="text-align: right;">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-number">#ON-{order._id:06d}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                <div>
                    <div class="section-title">Bill To</div>
                    <div class="section-content">
                        <div class="info-row">
                            <span>{order.user.first_name or order.user.username}</span>
                        </div>
                        <div class="info-row">
                            <span>{order.user.email}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="section-title">Ship To</div>
                    <div class="section-content">
                        <div class="info-row">
                            <span>{shipping_address.address}</span>
                        </div>
                        <div class="info-row">
                            <span>{shipping_address.city}, {shipping_address.postalCode}</span>
                        </div>
                        <div class="info-row">
                            <span>{shipping_address.country}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 40px;">
                <div>
                    <div class="section-title">Order Date</div>
                    <div class="section-content">{order.created_at.strftime('%B %d, %Y')}</div>
                </div>
                <div>
                    <div class="section-title">Payment Method</div>
                    <div class="section-content">{order.paymentMethod or 'Pending'}</div>
                </div>
                <div>
                    <div class="section-title">Status</div>
                    <div class="section-content">{paid_badge}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th style="text-align: center; width: 80px;">Qty</th>
                        <th style="text-align: right; width: 100px;">Unit Price</th>
                        <th style="text-align: right; width: 100px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {order_items_html}
                </tbody>
            </table>

            <div class="total-section">
                <table class="total-table">
                    <tr>
                        <td style="text-align: right;">Subtotal:</td>
                        <td style="text-align: right;">${total_items_price:.2f}</td>
                    </tr>
                    <tr>
                        <td style="text-align: right;">Shipping:</td>
                        <td style="text-align: right;">${order.shippingPrice:.2f}</td>
                    </tr>
                    <tr>
                        <td style="text-align: right;">Tax:</td>
                        <td style="text-align: right;">${order.taxPrice:.2f}</td>
                    </tr>
                    <tr class="total-row">
                        <td style="text-align: right;">Total:</td>
                        <td style="text-align: right;">${order.totalPrice:.2f}</td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                <p>Thank you for your purchase!</p>
                <p>For support, contact: support@mamigloexclusive.com</p>
                <p>&copy; 2025 mamigloexclusive. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_content


def generate_pdf_from_html(html_content, filename):
    """Convert HTML to PDF using xhtml2pdf"""
    try:
        from xhtml2pdf import pisa
        
        # Create PDF file object
        pdf_buffer = BytesIO()
        
        # Convert HTML to PDF
        pisa_status = pisa.CreatePDF(
            html_content,
            dest=pdf_buffer,
            encoding='UTF-8'
        )
        
        if pisa_status.err:
            return None
        
        pdf_buffer.seek(0)
        return pdf_buffer
    except ImportError:
        # Fallback: return HTML if xhtml2pdf not installed
        return None


def generate_invoice_filename(order):
    """Generate invoice filename"""
    return f"Invoice-Order-{order._id:06d}-{order.created_at.strftime('%Y%m%d')}"

