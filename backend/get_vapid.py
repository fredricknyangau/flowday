from py_vapid import Vapid
import base64
v = Vapid.from_file('private_key.pem')
print("Private:", base64.urlsafe_b64encode(v.private_key.private_numbers().private_value.to_bytes(32, 'big')).decode('utf-8').rstrip('='))
