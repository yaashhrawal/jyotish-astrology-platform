from fastapi import APIRouter
from pydantic import BaseModel
from core.engine import birth_to_jd, calculate_planets, NAKSHATRAS, NAKSHATRA_LORDS

router = APIRouter()


class CompatibilityRequest(BaseModel):
    # Person 1
    p1_year: int; p1_month: int; p1_day: int
    p1_hour: int; p1_minute: int; p1_tz_offset: float
    p1_lat: float; p1_lon: float; p1_name: str = "Person 1"
    # Person 2
    p2_year: int; p2_month: int; p2_day: int
    p2_hour: int; p2_minute: int; p2_tz_offset: float
    p2_lat: float; p2_lon: float; p2_name: str = "Person 2"
    ayanamsa: str = "lahiri"


RASHI_LORDS = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"]
GANA = {  # Nakshatra index -> Gana
    0:"Deva",1:"Manushya",2:"Rakshasa",3:"Deva",4:"Manushya",5:"Manushya",
    6:"Deva",7:"Deva",8:"Rakshasa",9:"Rakshasa",10:"Manushya",11:"Deva",
    12:"Deva",13:"Rakshasa",14:"Deva",15:"Rakshasa",16:"Deva",17:"Rakshasa",
    18:"Rakshasa",19:"Manushya",20:"Manushya",21:"Deva",22:"Rakshasa",23:"Deva",
    24:"Manushya",25:"Manushya",26:"Deva"
}
NADI = {i: ["Aadi","Madhya","Antya"][i%3] for i in range(27)}
YONI_ANIMAL = [
    "Horse","Elephant","Goat","Serpent","Dog","Cat","Rat","Cow",
    "Buffalo","Tiger","Deer","Monkey","Mongoose","Lion","Horse","Elephant",
    "Goat","Serpent","Dog","Cat","Rat","Cow","Buffalo","Tiger","Deer","Monkey","Mongoose"
]
FRIENDLY_YONI = {
    "Horse":["Horse"],"Elephant":["Elephant"],"Goat":["Goat"],"Serpent":["Serpent"],
    "Dog":["Dog"],"Cat":["Cat"],"Rat":["Rat","Mongoose"],"Cow":["Cow"],
    "Buffalo":["Buffalo"],"Tiger":["Tiger","Deer"],"Deer":["Deer","Tiger"],
    "Monkey":["Monkey"],"Mongoose":["Mongoose","Rat"],"Lion":["Lion"],
}


def get_nakshatra_index(moon_lon: float) -> int:
    return int(moon_lon / (360/27))


def koota_score(nak1: int, nak2: int, rashi1: int, rashi2: int) -> dict:
    scores = {}

    # 1. Varna (1 point)
    varna_order = {"Brahmin":4,"Kshatriya":3,"Vaishya":2,"Shudra":1}
    # sign→varna (0=Aries): Brahmin(4)=Cancer/Scorpio/Pisces, Kshatriya(3)=Aries/Leo/Sag,
    # Vaishya(2)=Taurus/Virgo/Cap, Shudra(1)=Gemini/Libra/Aquarius
    varna_map = {0:3,1:2,2:1,3:4,4:3,5:2,6:1,7:4,8:3,9:2,10:1,11:4}  # sign->varna
    v1, v2 = varna_map.get(rashi1,1), varna_map.get(rashi2,1)
    scores["Varna"] = {"score": 1 if v1 >= v2 else 0, "max": 1}

    # 2. Vashya (2 points) — BPHS tables: who has control over whom
    # Groups: Quadruped(Aries,Taurus,2H Leo,Cap,Sag), Human(Gemini,Virgo,Libra,Aquarius,1H Cap),
    #         Watery(Cancer,Pisces,1H Cap), Jalachara(Capricorn), Keeta(Scorpio), Vanachara(Leo)
    VASHYA_MAP = {0:"quadruped",1:"quadruped",2:"human",3:"watery",4:"vanachara",5:"human",
                  6:"human",7:"keeta",8:"quadruped",9:"jalachara",10:"human",11:"watery"}
    VASHYA_CONTROL = {
        "quadruped":["human","keeta"],"human":["vanachara","keeta"],
        "watery":["jalachara","keeta"],"vanachara":["human"],"keeta":[],"jalachara":["watery"],
    }
    vy1, vy2 = VASHYA_MAP.get(rashi1,"human"), VASHYA_MAP.get(rashi2,"human")
    if vy1 == vy2:
        scores["Vashya"] = {"score": 2, "max": 2}
    elif vy2 in VASHYA_CONTROL.get(vy1, []):
        scores["Vashya"] = {"score": 2, "max": 2}
    elif vy1 in VASHYA_CONTROL.get(vy2, []):
        scores["Vashya"] = {"score": 1, "max": 2}
    else:
        scores["Vashya"] = {"score": 0, "max": 2}

    # 3. Tara (3 points) — count both directions; taras 3(Vipat),5(Pratyari),7(Vadha)
    # are the INAUSPICIOUS ones (score 0). Both counts must be auspicious for full marks.
    def _tara_ok(a: int, b: int) -> bool:
        return (((b - a) % 27) % 9) + 1 not in (3, 5, 7)
    ok1, ok2 = _tara_ok(nak1, nak2), _tara_ok(nak2, nak1)
    scores["Tara"] = {"score": 3 if (ok1 and ok2) else 1.5 if (ok1 or ok2) else 0, "max": 3}

    # 4. Yoni (4 points)
    y1, y2 = YONI_ANIMAL[nak1], YONI_ANIMAL[nak2]
    if y1 == y2:
        scores["Yoni"] = {"score": 4, "max": 4}
    elif y2 in FRIENDLY_YONI.get(y1, []):
        scores["Yoni"] = {"score": 3, "max": 4}
    else:
        scores["Yoni"] = {"score": 1, "max": 4}

    # 5. Graha Maitri (5 points) — natural planetary friendship (BPHS)
    lord1 = RASHI_LORDS[rashi1]
    lord2 = RASHI_LORDS[rashi2]
    NATURAL_FRIENDS = {
        "Sun":     ["Moon","Mars","Jupiter"],
        "Moon":    ["Sun","Mercury"],
        "Mars":    ["Sun","Moon","Jupiter"],
        "Mercury": ["Sun","Venus"],
        "Jupiter": ["Sun","Moon","Mars"],
        "Venus":   ["Mercury","Saturn"],
        "Saturn":  ["Mercury","Venus"],
    }
    NATURAL_ENEMIES = {
        "Sun":     ["Venus","Saturn"],
        "Moon":    ["None"],
        "Mars":    ["Mercury"],
        "Mercury": ["Moon"],
        "Jupiter": ["Mercury","Venus"],
        "Venus":   ["Sun","Moon"],
        "Saturn":  ["Sun","Moon","Mars"],
    }
    def friendship(a: str, b: str) -> str:
        if b in NATURAL_FRIENDS.get(a, []): return "friend"
        if b in NATURAL_ENEMIES.get(a, []): return "enemy"
        return "neutral"
    f12, f21 = friendship(lord1, lord2), friendship(lord2, lord1)
    if lord1 == lord2:
        gm_score = 5
    elif f12 == "friend" and f21 == "friend":
        gm_score = 5
    elif f12 == "friend" or f21 == "friend":
        gm_score = 4
    elif f12 == "neutral" and f21 == "neutral":
        gm_score = 3
    elif f12 == "enemy" or f21 == "enemy":
        gm_score = 1
    else:
        gm_score = 0
    scores["Graha Maitri"] = {"score": gm_score, "max": 5}

    # 6. Gana (6 points)
    g1, g2 = GANA.get(nak1,"Deva"), GANA.get(nak2,"Deva")
    if g1 == g2:
        scores["Gana"] = {"score": 6, "max": 6}
    elif (g1=="Deva" and g2=="Manushya") or (g1=="Manushya" and g2=="Deva"):
        scores["Gana"] = {"score": 5, "max": 6}
    else:
        scores["Gana"] = {"score": 0, "max": 6}

    # 7. Bhakoot (7 points) — dosha is an ANGULAR relation between the two Moon
    # signs: 2/12, 5/9 or 6/8. Measure the circular distance, not literal numbers.
    dr = (rashi1 - rashi2) % 12
    diff_r = min(dr, 12 - dr)                 # 0..6
    bhakoot_bad = diff_r in (1, 4, 5)         # 2/12→1, 5/9→4, 6/8→5
    scores["Bhakoot"] = {"score": 0 if bhakoot_bad else 7, "max": 7}

    # 8. Nadi (8 points)
    n1, n2 = NADI.get(nak1,"Aadi"), NADI.get(nak2,"Aadi")
    scores["Nadi"] = {"score": 0 if n1 == n2 else 8, "max": 8}

    total = sum(v["score"] for v in scores.values())
    max_total = sum(v["max"] for v in scores.values())
    return {"kootas": scores, "total": total, "max": max_total, "percentage": round(total/max_total*100,1)}


@router.post("/compatibility")
def get_compatibility(data: CompatibilityRequest):
    jd1 = birth_to_jd(data.p1_year,data.p1_month,data.p1_day,data.p1_hour,data.p1_minute,data.p1_tz_offset)
    jd2 = birth_to_jd(data.p2_year,data.p2_month,data.p2_day,data.p2_hour,data.p2_minute,data.p2_tz_offset)

    p1 = calculate_planets(jd1, data.ayanamsa)
    p2 = calculate_planets(jd2, data.ayanamsa)

    nak1 = get_nakshatra_index(p1["Moon"]["longitude"])
    nak2 = get_nakshatra_index(p2["Moon"]["longitude"])
    rashi1 = p1["Moon"]["sign_index"]
    rashi2 = p2["Moon"]["sign_index"]

    result = koota_score(nak1, nak2, rashi1, rashi2)

    verdict = "Excellent match" if result["total"] >= 28 else \
              "Good match" if result["total"] >= 21 else \
              "Average match" if result["total"] >= 18 else "Challenging match"

    return {
        "person1": {"name": data.p1_name, "moon_sign": p1["Moon"]["sign"], "nakshatra": p1["Moon"]["nakshatra"]},
        "person2": {"name": data.p2_name, "moon_sign": p2["Moon"]["sign"], "nakshatra": p2["Moon"]["nakshatra"]},
        "score": result["total"],
        "max_score": result["max"],
        "percentage": result["percentage"],
        "verdict": verdict,
        "kootas": result["kootas"],
    }
