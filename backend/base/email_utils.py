"""
Email utilities for sending order confirmations, payment notifications, and other transactional emails.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import html


def send_order_confirmation_email(order, user):
    """Send order confirmation email to customer"""
    subject = f"Order Confirmation - mamigloexclusive #{order._id}"
    
    html_message = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; }}
                .header {{ border-bottom: 2px solid #0dcaf0; padding-bottom: 10px; margin-bottom: 20px; }}
                .header h1 {{ color: #333; margin: 0; }}
                .order-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                .order-details p {{ margin: 5px 0; }}
                .items-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .items-table th, .items-table td {{ padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }}
                .items-table th {{ background-color: #0dcaf0; color: white; }}
                .total {{ font-weight: bold; font-size: 18px; color: #333; }}
                .footer {{ background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-top: 20px; text-align: center; }}
                .footer p {{ margin: 5px 0; font-size: 12px; color: #666; }}
                .button {{ display: inline-block; background-color: #0dcaf0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Thank you for your order!</h1>
                    <p>Order #<strong>{order._id}</strong></p>
                </div>
                
                <p>Hello {user.first_name or user.username},</p>
                <p>We've received your order and it's being processed. Here are the details:</p>
                
                <div class="order-details">
                    <h3>Shipping Address</h3>
                    <p>{order.shippingaddress.address}</p>
                    <p>{order.shippingaddress.city}, {order.shippingaddress.postalCode}</p>
                    <p>{order.shippingaddress.country}</p>
                </div>
                
                <h3>Order Items</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
    """
    
    for item in order.orderitems.all():
        item_total = item.price * item.qty
        html_message += f"""
                        <tr>
                            <td>{item.name}</td>
                            <td>{item.qty}</td>
                            <td>${item.price:.2f}</td>
                            <td>${item_total:.2f}</td>
                        </tr>
        """
    
    html_message += f"""
                    </tbody>
                </table>
                
                <div class="order-details">
                    <p><strong>Subtotal:</strong> ${order.totalPrice - order.shippingPrice - order.taxPrice:.2f}</p>
                    <p><strong>Shipping:</strong> ${order.shippingPrice:.2f}</p>
                    <p><strong>Tax:</strong> ${order.taxPrice:.2f}</p>
                    <p class="total"><strong>Total:</strong> ${order.totalPrice:.2f}</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="http://localhost:3000/order/{order._id}" class="button">View Order Status</a>
                </div>
                
                <div class="footer">
                    <p>If you have any questions, please contact us at support@mamigloexclusive.com</p>
                    <p>&copy; 2025 mamigloexclusive. All rights reserved.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    send_mail(
        subject,
        f"Order Confirmation for order #{order._id}",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=True,
    )


def send_payment_confirmation_email(order, user, payment_method):
    """Send payment confirmation email"""
    subject = f"Payment Confirmed - Order #{order._id} - mamigloexclusive"
    
    html_message = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; }}
                .header {{ border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-bottom: 20px; }}
                .header h1 {{ color: #28a745; margin: 0; }}
                .order-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                .footer {{ background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-top: 20px; text-align: center; }}
                .footer p {{ margin: 5px 0; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Payment Confirmed!</h1>
                </div>
                
                <p>Hello {user.first_name or user.username},</p>
                <p>Thank you! Your payment has been successfully processed.</p>
                
                <div class="order-details">
                    <p><strong>Order Number:</strong> #{order._id}</p>
                    <p><strong>Payment Method:</strong> {payment_method}</p>
                    <p><strong>Amount:</strong> ${order.totalPrice:.2f}</p>
                    <p><strong>Date:</strong> {order.paidAt or 'Processing'}</p>
                </div>
                
                <p>Your order is now being prepared for shipment. You'll receive a tracking number via email once it ships.</p>
                
                <div class="footer">
                    <p>If you have any questions, please contact us at support@mamigloexclusive.com</p>
                    <p>&copy; 2025 mamigloexclusive. All rights reserved.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    send_mail(
        subject,
        f"Payment confirmed for order #{order._id}",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=True,
    )


def send_order_shipped_email(order, user, tracking_number=None):
    """Send order shipped notification"""
    subject = f"Your Order Has Shipped - #{order._id} - mamigloexclusive"
    
    tracking_info = ""
    if tracking_number:
        tracking_info = f"<p><strong>Tracking Number:</strong> {tracking_number}</p>"
    
    html_message = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; }}
                .header {{ border-bottom: 2px solid #0dcaf0; padding-bottom: 10px; margin-bottom: 20px; }}
                .header h1 {{ color: #0dcaf0; margin: 0; }}
                .order-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                .footer {{ background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-top: 20px; text-align: center; }}
                .footer p {{ margin: 5px 0; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📦 Your Order Has Shipped!</h1>
                </div>
                
                <p>Hello {user.first_name or user.username},</p>
                <p>Great news! Your order is on its way.</p>
                
                <div class="order-details">
                    <p><strong>Order Number:</strong> #{order._id}</p>
                    {tracking_info}
                    <p><strong>Estimated Delivery:</strong> 5-7 business days</p>
                </div>
                
                <p>You can track your package using the tracking number above. Click the button below to view your order status.</p>
                
                <div style="text-align: center;">
                    <a href="http://localhost:3000/order/{order._id}" style="display: inline-block; background-color: #0dcaf0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Order</a>
                </div>
                
                <div class="footer">
                    <p>If you have any questions, please contact us at support@mamigloexclusive.com</p>
                    <p>&copy; 2025 mamigloexclusive. All rights reserved.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    send_mail(
        subject,
        f"Your order #{order._id} has been shipped",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=True,
    )


def send_transfer_payment_reminder_email(order, user):
    """Send reminder for bank transfer payment"""
    subject = f"Payment Reminder - Bank Transfer for Order #{order._id}"
    
    html_message = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; }}
                .header {{ border-bottom: 2px solid #ffc107; padding-bottom: 10px; margin-bottom: 20px; }}
                .header h1 {{ color: #ffc107; margin: 0; }}
                .order-details {{ background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                .footer {{ background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-top: 20px; text-align: center; }}
                .footer p {{ margin: 5px 0; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Payment Pending</h1>
                </div>
                
                <p>Hello {user.first_name or user.username},</p>
                <p>We're still waiting for your bank transfer payment for order #{order._id}.</p>
                
                <div class="order-details">
                    <p><strong>Order Number:</strong> #{order._id}</p>
                    <p><strong>Amount Due:</strong> ${order.totalPrice:.2f}</p>
                    <p>Please complete your transfer to activate this order. You can view the bank details in your order page.</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="http://localhost:3000/order/{order._id}" style="display: inline-block; background-color: #0dcaf0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Payment</a>
                </div>
                
                <div class="footer">
                    <p>If you have any questions, please contact us at support@mamigloexclusive.com</p>
                    <p>&copy; 2025 mamigloexclusive. All rights reserved.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    send_mail(
        subject,
        f"Payment reminder for order #{order._id}",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=True,
    )
