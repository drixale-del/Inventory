import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class DatabaseHandler:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment.")
            self.supabase = None
        else:
            self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    def get_product_by_barcode(self, barcode):
        """
        Fetch product details by barcode.
        Returns product data if found, else None.
        """
        if not self.supabase:
            return {"error": "Database not connected"}
            
        try:
            response = self.supabase.table("products").select("*").eq("barcode", barcode).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error querying product: {e}")
            return {"error": str(e)}

    def log_scan_event(self, barcode, cashier_id, action, device_id="Local", method="USB"):
        """
        Log a scan event for audit trails.
        Actions: 'added', 'failed', 'duplicate', 'out_of_stock'
        """
        if not self.supabase:
            return
            
        try:
            data = {
                "barcode": barcode,
                "cashier_id": cashier_id,
                "action": action,
                "device_id": device_id,
                "method": method
            }
            self.supabase.table("scan_logs").insert(data).execute()
        except Exception as e:
            print(f"Error logging scan event: {e}")

    def update_stock(self, product_id, new_quantity):
        """
        Update product stock level.
        """
        if not self.supabase:
            return
            
        try:
            self.supabase.table("products").update({"stock_quantity": new_quantity}).eq("id", product_id).execute()
        except Exception as e:
            print(f"Error updating stock: {e}")

# Singleton instance
db = DatabaseHandler()

if __name__ == "__main__":
    import argparse
    import json
    import sys

    parser = argparse.ArgumentParser(description="Database Handler CLI")
    parser.add_argument("--barcode", type=str, help="Product barcode to lookup")
    parser.add_argument("--log", action="store_true", help="Log a scan event")
    parser.add_argument("--user", type=str, help="Cashier ID for logging")
    parser.add_argument("--action", type=str, help="Action for logging")
    parser.add_argument("--device", type=str, help="Device ID for logging")
    parser.add_argument("--method", type=str, help="Scan method for logging")

    args = parser.parse_args()

    if args.barcode and not args.log:
        result = db.get_product_by_barcode(args.barcode)
        print(json.dumps(result))
    elif args.log and args.barcode:
        db.log_scan_event(
            args.barcode, 
            args.user or "Unknown", 
            args.action or "added",
            args.device or "Local",
            args.method or "USB"
        )
        print(json.dumps({"status": "logged"}))
    else:
        print(json.dumps({"error": "Invalid arguments"}))
