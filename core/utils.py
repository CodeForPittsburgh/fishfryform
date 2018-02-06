from datetime import datetime
from dateutil.parser import parse
from dateutil import tz


def sort_records(recordset, sort_key):
    """sort a list of dictionary using the values from a common key

    Arguments:
        recordset {[list]} -- list of dictionaries
        sort_key {[str]} -- dictionary key on which data will be sorted

    Returns:
        [type] -- [description]
    """

    return sorted(recordset, key=lambda k: k[sort_key])


def postprocess_event_forms(form_dict, sort_key="dt_start", prefix="events-", break_val="-", time_direction="to_utc"):
    """transform a submitted WTForm form containing events into our events array model
    """
    times = [{k: v} for k, v in form_dict.items() if prefix in k]
    events = {}
    for t in times:
        k = list(t.keys())[0]
        v = handle_utc(t[k], time_direction)
        brk = k.strip(prefix).find(break_val)
        suffix = k.lstrip(prefix)
        uid = str(suffix[:brk])
        etype = suffix[brk+1:]
        if uid in events.keys():
            events[uid].update({etype: v})
        else:
            events[uid] = {etype: v}
    event_array = [v for k, v in events.items()]
    return sorted(event_array, key=lambda k: k[sort_key])


def events_for_forms(events_array):
    """parse each event in the events array (from the database)
    into a ISO datetime range string, returning an array sorted oldest/newest.
    """
    events = [
        "{0}/{1}".format(e['dt_start'], e['dt_end']) for e in events_array
    ]
    events.sort()
    return events


event_strf_plain = "%b %d %Y, %I:%M%p"
event_strf_techy = "%Y-%m-%d %I:%M%p"


def iso_dt_range_conversion(
    iso_dt_range_str,
    strf_str_start=event_strf_techy,
    strf_str_end=event_strf_techy,
    break_txt=" to "
):
    beg, end = tuple(iso_dt_range_str.split("/"))
    event_string = "{0}{2}{1}".format(
        parse(beg).strftime(strf_str_start),
        parse(end).strftime(strf_str_end),
        break_txt
    )
    return event_string


def handle_utc(datestring, direction="to_local", to_zone='America/New_York', from_zone='UTC'):
    """ a wrapper for dateutil.parse that helps convert UTC to/from local 
    timezone ISO8601-formatted strings.

    @param string datestring: ISO 8601 formatted datetime string

    Datetimes are stored in CARTO in UTC. When a dateime value is retrieved,
    it is returned as an ISO 8601 formatted datetime string with a 'Z'.

    Since (for now) we're concerned with Fish Fry in Western PA, we are assuming
    that users are giving us times for the Fish Frys in the Eastern Time Zone.
    So on the client-side, times will all be local time. Python will handle
    conversion from utc to local for use on the client-side.

    Coming back, if times have the UTC offset included, then they can be fed
    straight back into CARTO. .e.,g 2017-03-03T14:00:00-05:00 will show in the
    db as 2017-03-03T19:00:00Z.

    See these links for more info:
    http://stackoverflow.com/questions/4770297/python-convert-utc-datetime-string-to-local-datetime
    http://stackoverflow.com/questions/969285/how-do-i-translate-a-iso-8601-datetime-string-into-a-python-datetime-object
    """

    # METHOD 1: Hardcode zones:
    from_zone = tz.gettz(from_zone)
    to_zone = tz.gettz(to_zone)

    # METHOD 2: Auto-detect zones:
    #from_zone = tz.tzutc()
    #to_zone = tz.tzlocal()

    # parse the ISO 8601-formatted, UTC (zulu) string into a datetime object.
    # e.g., '2017-03-03T17:00:00Z'
    t = parse(datestring)

    if direction == "to_local" or direction == "from_utc":
        # Tell the datetime object that it's in UTC time zone since
        # datetime objects are 'naive' by default
        t = t.replace(tzinfo=from_zone)

        # Convert time zone
        tc = t.astimezone(to_zone)

        # return result as ISO 8601-formatted string, now with UTC offset
        # e.g., '2017-03-03T12:00:00-05:00'
        return tc.isoformat()

    elif direction == "to_utc" or direction == "from_local":

        t = t.replace(tzinfo=to_zone)

        # Convert time zone
        tc = t.astimezone(from_zone)

        return tc.isoformat()

    else:
        raise Exception
    print("incorrect datetime conversion direction string (must be 'to_utc' or 'to_local')")
