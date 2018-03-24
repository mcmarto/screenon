import os
import sqlite3
from flask import Flask, request, session, g, jsonify, abort, render_template

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

@app.route("/")
def render_index():
    return render_template("index.html")

@app.route("/data/last-instant")
def retrieve_last_instant():
    db = get_db()
    cur = db.execute("select max(instant) from screenon")
    try:
        entries = cur.fetchall()
        print(entries)
        print(entries[0])
        print(entries[0][0])
        last_instant = entries[0][0]
        if not last_instant:
            last_instant = 0
    except IndexError:
        last_instant = 0
    return jsonify({"instant": last_instant})

@app.route("/data/all")
def show_entries():
    db = get_db()
    cur = db.execute("select * from screenon order by instant asc")
    entries = cur.fetchall()
    serialized_entries = [{"instant": entry[0], "on_off": bool(entry[1])} for entry in entries]
    return jsonify({"response": serialized_entries})

@app.route("/data", methods=["POST"])
def add_entry():
    db = get_db()
    input_data = request.get_json()
    if input_data:
        for new_entry in input_data:
            db.execute("insert into screenon (instant, ison) values (?, ?)", (new_entry["instant"], new_entry["on_off"] and 1 or 0))
        db.execute("commit")
        return jsonify({"response": "OK"})
    else:
        print("error: malformed json")
        abort(400)
