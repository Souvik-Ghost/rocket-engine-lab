import math
import numpy as np

def calculate_lre(req):
    # Base params
    thrust = req.target_thrust_N
    pc_pa = req.chamber_pressure_bar * 100000
    er = max(req.expansion_ratio, 1.1)
    
    # Propellant properties
    props = {
        "LOX/RP-1": {"gamma": 1.22, "R": 300, "temp": 3500},
        "LH2/LOX": {"gamma": 1.20, "R": 500, "temp": 3300},
        "Methane/LOX": {"gamma": 1.21, "R": 350, "temp": 3400},
        "Hydrazine/NTO": {"gamma": 1.24, "R": 310, "temp": 3200},
    }
    
    prop_data = props.get(req.propellant, props["LOX/RP-1"])
    gamma = prop_data["gamma"]
    R = prop_data["R"]
    Tc = prop_data["temp"]
    
    # Altitude ambient pressure estimation
    alt = max(req.altitude_m, 0)
    Pa = 101325 * math.exp(-9.80665 * 0.0289644 * alt / (8.3144598 * 288.15))
    if alt > 100000:
        Pa = 0
    
    g = 9.80665
    
    c_star = math.sqrt((R * Tc) / gamma) * math.pow((2 / (gamma + 1)), -(gamma + 1) / (2 * (gamma - 1)))
    
    # Avoid math domain error if Pa > pc_pa
    pressure_ratio = Pa / pc_pa if pc_pa > Pa else 1.0
    
    cf_ideal = math.sqrt((2 * math.pow(gamma, 2) / (gamma - 1)) * math.pow(2 / (gamma + 1), (gamma + 1) / (gamma - 1)) * (1 - math.pow(pressure_ratio, (gamma - 1) / gamma)))
    if pc_pa <= Pa or np.isnan(cf_ideal) or cf_ideal <= 0:
        cf_ideal = 0.5 # fallback when choking is not proper
        
    isp = (c_star * cf_ideal) / g
    
    if req.combustion_cycle == "gas_generator":
        isp *= 0.95
        
    mass_flow = thrust / (isp * g) if isp > 0 else 0
    throat_area = (mass_flow * c_star) / pc_pa if pc_pa > 0 else 0
    throat_radius_mm = math.sqrt(throat_area / math.pi) * 1000 if throat_area > 0 else 0
    exit_radius_mm = throat_radius_mm * math.sqrt(er)
    
    time_points = np.linspace(0, 10, 20)
    sim_data = []
    for t in time_points:
        noise_t = thrust * (1 + (np.random.random() * 0.04 - 0.02))
        noise_p = req.chamber_pressure_bar * (1 + (np.random.random() * 0.06 - 0.03))
        sim_data.append({"time": round(t, 2), "val1": round(noise_t, 2), "val2": round(noise_p, 2)})

    return {
        "isp": round(isp, 1),
        "mass_flow": round(mass_flow, 3),
        "throat_radius_mm": round(throat_radius_mm, 2),
        "exit_radius_mm": round(exit_radius_mm, 2),
        "efficiency": round((isp / 450) * 100, 1),
        "sim_data": sim_data
    }

def calculate_ag(req):
    gf = req.graviton_flux_thz
    intensity = req.field_intensity_t
    perm = req.spacetime_permittivity
    casimir = req.casimir_pressure_nn
    
    lift_base = gf * intensity * 1.5
    if req.field_geometry == 'toroidal':
        lift_base *= 1.2
    elif req.field_geometry == 'spherical':
        lift_base *= 0.9
        
    if req.power_source == 'antimatter':
        lift_base *= 2.0
        
    lift_force = lift_base
    mass_reduction = min(intensity * perm * 50 / 100, 99.9) 
    warp_factor = math.log10(max(gf, 1)) * intensity * (perm / 100)
    power_draw = casimir * 100
    
    time_points = np.linspace(0, 10, 20)
    sim_data = []
    for t in time_points:
        val1 = gf * (1 + (np.random.random() * 0.04 - 0.02))
        val2 = intensity * 100 * (1 + (np.random.random() * 0.06 - 0.03))
        sim_data.append({"time": round(t, 2), "val1": round(val1, 2), "val2": round(val2, 2)})

    return {
        "lift_kn": round(lift_force, 2),
        "mass_reduction_pct": round(mass_reduction, 1),
        "warp_factor": round(warp_factor, 3),
        "power_draw_kw": round(power_draw, 0),
        "efficiency": round(intensity * perm, 1),
        "sim_data": sim_data
    }
