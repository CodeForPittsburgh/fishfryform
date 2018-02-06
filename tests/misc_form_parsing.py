from core import utils

ff = {
    "events-4-dt_start": "03/09/2018 4:00 PM",
    "ffid": "56931e40-088f-48d5-9de6-07d79d471741",
    "homemade_pierogies": "Unsure / N/A",
    "lunch": "Unsure / N/A",
    "venue_notes": "Guests should enter through the Front Porch entrance.",
    "menu_txt": "Platters (include cole slaw and choice of homemade chips or fries): Baked or Fried Fish Sandwiches $9.00 - Shrimp Basket $7.50 | Entrees: Fish Sandwich (Fried or baked) $7.50 - Shrimp Basket $6.50 - Pierogies $6.00 | Sides: Homemade Chips $2.00 - Fresh Cut Fries $2.00 - Macaroni & Cheese $3 - Homemade Haluski $3 - Homemade Cole Slaw $1",
    "events-6-dt_start": "03/23/2018 4:00 PM",
    "phone": "",
    "events-2-dt_start": "02/23/2018 4:00 PM",
    "handicap": "Unsure / N/A",
    "menu_url": "",
    "venue_type": "Community Organization",
    "venue_name": "American Legion Post 760, Bethel Park",
    "events-1-dt_start": "02/16/2018 4:00 PM",
    "alcohol": "Unsure / N/A",
    "email": "",
    "events-6-dt_end": "03/23/2018 8:00 PM",
    "events-5-dt_start": "03/16/2018 4:00 PM",
    "events-5-dt_end": "03/16/2018 8:00 PM",
    "etc": "Fish Fry starts Ash Wednesday 3-8pm-Every Friday following 4-8pm, Good Friday will be 2-7pm, The upstairs is Open to the public. Eat in or take out available. CASH ONLY.  Proceeds are to benefit the local veterans.",
    "events-3-dt_end": "03/02/2018 8:00 PM",
    "venue_address": "2409 Bethel Church Rd., Bethel Park, PA 15102",
    "events-3-dt_start": "03/02/2018 4:00 PM",
    "lat": "40.344581",
    "events-0-dt_end": "02/14/2018 8:00 PM",
    "take_out": "Unsure / N/A",
    "events-4-dt_end": "03/09/2018 8:00 PM",
    "website": "",
    "events-1-dt_end": "02/16/2018 8:00 PM",
    "events-0-dt_start": "02/14/2018 3:00 PM",
    "events-7-dt_start": "03/30/2018 2:00 PM",
    "events-7-dt_end": "03/30/2018 7:00 PM",
    "events-2-dt_end": "02/23/2018 8:00 PM",
    "lng": "-80.03048"
}


prefix = "events-"
break_val = "-"
sort_key = "dt_start"

# get only the items that represente events
times = [{k: v} for k, v in ff.items() if prefix in k]

# parse those into pairs; keep track of what we parsed because we
# will clean up the original, later
keys_to_pop = []
event_data = {}
for t in times:
    k = list(t.keys())[0]
    keys_to_pop.append(k)
    v = utils.handle_utc(t[k], "to_utc")
    brk = k.strip(prefix).find(break_val)
    suffix = k.lstrip(prefix)
    uid = str(suffix[:brk])
    etype = suffix[brk+1:]
    # print(suffix, uid, etype, v)
    if uid in event_data.keys():
        event_data[uid].update({etype: v})
    else:
        event_data[uid] = {etype: v}
# now that we have our start/end pairs grouped, form the events array
event_array = [v for k, v in event_data.items()]
events = sorted(event_array, key=lambda k: k[sort_key])
# for e in sorted_events:
#     print(e)

# remove event keys from the original
properties = {k: v for k, v in ff.items() if k not in keys_to_pop}
# add in the events array
properties['events'] = events

# post process the menu data
menu_url = properties.pop('menu_url')
menu_txt = properties.pop('menu_txt')
properties['menu'] = {
    "url": menu_url,
    "text": menu_txt
}

# post process the boolean data
boollookup = {
    'Unsure / N/A': None,
    'Yes': True,
    'No': False
}
for b in [
    "homemade_pierogies",
    "lunch",
    "take_out",
    "handicap",
    "alcohol"
]:
    if properties[b] in boollookup.keys():
        properties[b] = boollookup[properties[b]]
    else:
        properties[b] = None

# post process geometry data
lat = properties.pop('lat')
lng = properties.pop('lng')
geometry = {
    "type": "Point",
    "coordinates": [lng, lat]
}

print("properties", properties)
print("geometry", geometry)
