import os
import sqlite3
from flask import Flask, request, session, g, jsonify, abort, render_template
from flask_cors import cross_origin 

app = Flask(__name__)
app.config.from_object(__name__)
    
print("DATABASE PATH", os.path.join(app.root_path, 'screenon.db'))

app.config.update(dict(
    # DATABASE=os.path.join(app.root_path, 'screenon.db'),
    DATABASE='./screenon.db',
    SECRET_KEY="random key",
    USERNAME="admin",
    PASSWORD="default"
))
app.config.from_envvar("SCREENON_SETTINGS", silent=True)

def connect_db():
    rv = sqlite3.connect(app.config["DATABASE"])
    rv.row_factory = sqlite3.Row
    return rv

def get_db():
    if not hasattr(g, "sqlite_db"):
        g.sqlite_db = connect_db()
    return g.sqlite_db

@app.teardown_appcontext
def close_db(error):
    if hasattr(g, "sqlite_db"):
        g.sqlite_db.close()


@app.route("/data/instants")
def retrieve_first_and_last_instants():
    db = get_db()
    cur = db.execute("select min(instant), max(instant) from screenon")
    try:
        entries = cur.fetchall()
        first_instant = entries[0][0]
        last_instant = entries[0][1]
    except IndexError:
        first_instant = 0
        last_instant = 0
    return jsonify({
        "first_instant": float(first_instant),
        "last_instant": float(last_instant)})

@app.route("/data/last-instant")
def retrieve_last_instant():
    db = get_db()
    cur = db.execute("select max(instant) from screenon")
    try:
        entries = cur.fetchall()
        print(entries[0][0])
        last_instant = entries[0][0]
        if not last_instant:
            last_instant = 0
    except IndexError:
        last_instant = 0
    return jsonify({"instant": float(last_instant)})

@app.route("/data/all")
@cross_origin()
def show_entries():
    db = get_db()
    cur = db.execute("select * from screenon order by instant asc")
    entries = cur.fetchall()
    serialized_entries = [{"instant": float(entry[0]), "on_off": bool(int(entry[1]))} for entry in entries]
    return jsonify({"response": serialized_entries})

@app.route("/data/after/<instant>")
@cross_origin()
def show_entries_after_instant(instant):
    db = get_db()
    cur = db.execute("select * from screenon where instant > ? order by instant asc", (instant, ))
    entries = cur.fetchall()
    serialized_entries = [{"instant": float(entry[0]), "on_off": bool(int(entry[1]))} for entry in entries]
    return jsonify({"response": serialized_entries})

@app.route("/data/between/<start_instant>/and/<end_instant>")
@cross_origin()
def show_entries_between_instants(start_instant, end_instant):
    db = get_db()
    cur = db.execute("select * from screenon where instant >= ? and instant <= ? order by instant asc", (start_instant, end_instant))
    entries = cur.fetchall()
    serialized_entries = [{"instant": float(entry[0]), "on_off": bool(int(entry[1]))} for entry in entries]
    return jsonify({"response": serialized_entries})

@app.route("/data", methods=["POST"])
def add_entry():
    db = get_db()
    input_data = request.get_json()
    if input_data:
        for new_entry in input_data:
            db.execute("insert into screenon (instant, ison) values (?, ?)", (new_entry["instant"], new_entry["on_off"] and 1 or 0))
        db.commit()
        print("ok!")
        return jsonify({"response": "OK"})
    else:
        print("error: malformed json")
        abort(400)
