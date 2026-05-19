ACTIVITY_PROFILES = {
    "business_launch": ["sun", "mars", "jupiter"],
    "negotiation": ["mercury", "venus", "jupiter"],
    "investment": ["jupiter", "venus", "saturn", "pluto"],
    "contract_signing": ["mercury", "saturn", "jupiter"],
    "hiring": ["mercury", "jupiter", "moon"],
    "real_estate": ["moon", "venus", "saturn", "jupiter"],
    "travel": ["jupiter", "mercury", "sun"],
    "creative_work": ["venus", "neptune", "uranus"],
    "rest_recovery": ["moon", "neptune", "saturn"],
    "networking": ["venus", "mercury", "jupiter", "sun"],
    "finance_transaction": ["venus", "jupiter", "saturn", "mercury"]
}

def calculate_activity_score(user_natal_data: dict, current_transit_data: dict, activity_type: str) -> dict:
    activity = activity_type.lower()
    if "launch" in activity: activity = "business_launch"
    elif "contract" in activity: activity = "contract_signing"
    elif "invest" in activity: activity = "investment"
    elif "finance" in activity: activity = "finance_transaction"
    
    rulers = ACTIVITY_PROFILES.get(activity, ["sun", "jupiter"])
    
    score = 50.0
    adjustments = {"aspects": 0.0, "natal_house_alignment": 0.0, "transit_retrograde": 0.0}
    aspects_evaluated = []
    
    natal_planets = user_natal_data.get("planets", {})
    transit_planets = current_transit_data.get("planets", {})
    
    precomputed_aspects = current_transit_data.get("aspects", [])
    if precomputed_aspects:
        for asp in precomputed_aspects:
            t_p = asp.get("transit_planet", "").lower()
            n_p = asp.get("natal_planet", "").lower()
            kind = asp.get("aspect", "").lower()
            orb = asp.get("orb", 1.0)
            
            if t_p in rulers or n_p in rulers:
                weight = 1.0 / (1.0 + orb)
                if kind in ["trine", "sextile"]:
                    adjustments["aspects"] += 15 * weight
                elif kind in ["square", "opposition"]:
                    adjustments["aspects"] -= 15 * weight
                elif kind == "conjunction":
                    if t_p in ["jupiter", "venus"]: adjustments["aspects"] += 10 * weight
                    else: adjustments["aspects"] -= 10 * weight
                aspects_evaluated.append(f"{t_p} {kind} {n_p} (orb {orb})")
    
    for planet in rulers:
        if planet in natal_planets:
            p_data = natal_planets[planet]
            house = p_data.get("house", 1)
            if house in [10, 5, 2, 11]:
                adjustments["natal_house_alignment"] += 3.0
                
        if planet in transit_planets:
            t_data = transit_planets[planet]
            if t_data.get("is_retrograde") or t_data.get("retrograde"):
                adjustments["transit_retrograde"] -= 10.0
                
    score += adjustments["aspects"] + adjustments["natal_house_alignment"] + adjustments["transit_retrograde"]
    score = max(0.0, min(100.0, score))
    
    rating = "RED" if score < 45 else "YELLOW" if score < 70 else "GREEN"
    
    return {
        "executive": {
            "score": int(score),
            "rating": rating,
            "summary": f"Analysis completed for {activity_type}.",
            "recommendation": "Highly favorable blueprint." if rating == "GREEN" else "Proceed with caution."
        },
        "strategic": {
            "adjustments": adjustments,
            "themes": [f"Focusing on primary rulers: {', '.join(rulers)}"],
            "opportunities": ["Favorable geometry found"] if score >= 50 else ["Mitigated risks"],
            "risks": ["Retrograde blockages"] if adjustments["transit_retrograde"] < 0 else ["Minor orb friction"],
            "timing_notes": "Optimal windows are being computed."
        },
        "technical": {
            "aspects_evaluated": aspects_evaluated,
            "metadata": {"base_score": 50, "activity_type": activity},
            "planet_lists": rulers
        }
    }