"""
Propulsion Simulation Engine
- Traditional LRE: De Laval nozzle thermodynamics
- Antigravity: Theoretical quantum field models
"""

import math
import numpy as np


# Propellant thermodynamic constants
PROPELLANT_DATA = {
    "LOX/RP-1":       {"gamma": 1.22, "R": 300, "temp": 3500},
    "LH2/LOX":        {"gamma": 1.20, "R": 500, "temp": 3300},
    "Methane/LOX":     {"gamma": 1.21, "R": 350, "temp": 3400},
    "Hydrazine/NTO":   {"gamma": 1.24, "R": 310, "temp": 3200},
}

# Geometry modifiers for antigravity field shapes
AG_GEOMETRY_MODS = {
    "toroidal": 1.2,
    "spherical": 0.9,
    "cylindrical": 1.0,
}

# Power source multipliers
AG_POWER_MODS = {
    "cold_fusion": 1.0,
    "antimatter": 2.0,
}

G0 = 9.80665  # Standard gravity (m/s²)
SEA_LEVEL_PRESSURE = 101325  # Pa


def _ambient_pressure(altitude_m: float) -> float:
    """Barometric formula for ambient pressure at a given altitude."""
    alt = max(altitude_m, 0)
    if alt > 100000:
        return 0.0
    return SEA_LEVEL_PRESSURE * math.exp(
        -G0 * 0.0289644 * alt / (8.3144598 * 288.15)
    )


def _generate_sim_trace(base_val1: float, base_val2: float, seed: int = 42) -> list:
    """Generate a deterministic noisy telemetry trace for charting."""
    rng = np.random.default_rng(seed)
    time_points = np.linspace(0, 10, 20)
    sim_data = []
    for t in time_points:
        noise1 = base_val1 * (1 + (rng.random() * 0.04 - 0.02))
        noise2 = base_val2 * (1 + (rng.random() * 0.06 - 0.03))
        sim_data.append({
            "time": round(float(t), 2),
            "val1": round(float(noise1), 2),
            "val2": round(float(noise2), 2),
        })
    return sim_data


def calculate_lre(req):
    """
    Compute traditional liquid rocket engine performance using
    De Laval nozzle thermodynamics.
    """
    thrust = req.target_thrust_N
    pc_pa = req.chamber_pressure_bar * 100000  # Convert bar → Pa
    er = max(req.expansion_ratio, 1.1)

    prop_data = PROPELLANT_DATA.get(req.propellant, PROPELLANT_DATA["LOX/RP-1"])
    gamma = prop_data["gamma"]
    R = prop_data["R"]
    Tc = prop_data["temp"]

    Pa = _ambient_pressure(req.altitude_m)

    # --- Guard: engine cannot operate if ambient pressure >= chamber pressure ---
    if pc_pa <= Pa:
        return {
            "isp": 0.0,
            "mass_flow": 0.0,
            "throat_radius_mm": 0.0,
            "exit_radius_mm": 0.0,
            "efficiency": 0.0,
            "error": "Chamber pressure must exceed ambient pressure for flow.",
            "sim_data": _generate_sim_trace(0, 0),
        }

    # Characteristic velocity (c*)
    c_star = (
        math.sqrt((R * Tc) / gamma)
        * math.pow((2 / (gamma + 1)), -(gamma + 1) / (2 * (gamma - 1)))
    )

    # Thrust coefficient (Cf) — pressure ratio is always Pa/Pc here
    pressure_ratio = Pa / pc_pa
    cf_term = (
        (2 * gamma**2 / (gamma - 1))
        * math.pow(2 / (gamma + 1), (gamma + 1) / (gamma - 1))
        * (1 - math.pow(pressure_ratio, (gamma - 1) / gamma))
    )

    if cf_term <= 0:
        cf_ideal = 0.5  # Fallback for edge-case numerical issues
    else:
        cf_ideal = math.sqrt(cf_term)

    # Specific impulse
    isp = (c_star * cf_ideal) / G0

    # Gas generator cycle penalty
    if req.combustion_cycle == "gas_generator":
        isp *= 0.95

    # Derived quantities
    mass_flow = thrust / (isp * G0) if isp > 0 else 0
    throat_area = (mass_flow * c_star) / pc_pa if pc_pa > 0 else 0
    throat_radius_mm = math.sqrt(throat_area / math.pi) * 1000 if throat_area > 0 else 0
    exit_radius_mm = throat_radius_mm * math.sqrt(er)

    # Deterministic sim trace (seeded by a hash of key params for stability)
    seed = int(abs(hash((thrust, req.chamber_pressure_bar, req.propellant, er)))) % (2**31)
    sim_data = _generate_sim_trace(thrust, req.chamber_pressure_bar, seed)

    return {
        "isp": round(isp, 1),
        "mass_flow": round(mass_flow, 3),
        "throat_radius_mm": round(throat_radius_mm, 2),
        "exit_radius_mm": round(exit_radius_mm, 2),
        "efficiency": round((isp / 450) * 100, 1),
        "sim_data": sim_data,
    }


def calculate_ag(req):
    """
    Compute theoretical antigravity propulsion parameters
    using quantum field models.
    """
    gf = req.graviton_flux_thz
    intensity = req.field_intensity_t
    perm = req.spacetime_permittivity
    casimir = req.casimir_pressure_nn

    geometry_mod = AG_GEOMETRY_MODS.get(req.field_geometry, 1.0)
    power_mod = AG_POWER_MODS.get(req.power_source, 1.0)

    lift_force = gf * intensity * 1.5 * geometry_mod * power_mod
    mass_reduction = min(intensity * perm * 50 / 100, 99.9)
    warp_factor = math.log10(max(gf, 1)) * intensity * (perm / 100)
    power_draw = casimir * 100

    seed = int(abs(hash((gf, intensity, perm, casimir)))) % (2**31)
    sim_data = _generate_sim_trace(gf, intensity * 100, seed)

    return {
        "lift_kn": round(lift_force, 2),
        "mass_reduction_pct": round(mass_reduction, 1),
        "warp_factor": round(warp_factor, 3),
        "power_draw_kw": round(power_draw, 0),
        "efficiency": round(intensity * perm, 1),
        "sim_data": sim_data,
    }
