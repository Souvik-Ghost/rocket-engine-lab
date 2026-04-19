from pydantic import BaseModel
from typing import Optional

class LREDesignReq(BaseModel):
    propellant: str
    target_thrust_N: float
    chamber_pressure_bar: float
    expansion_ratio: float
    combustion_cycle: str  # 'gas_generator', 'staged_combustion'
    altitude_m: float # for external pressure

class AGDesignReq(BaseModel):
    field_geometry: str # 'toroidal', 'spherical', 'cylindrical'
    graviton_flux_thz: float
    field_intensity_t: float
    casimir_pressure_nn: float
    spacetime_permittivity: float
    power_source: str # 'cold_fusion', 'antimatter'

class ChatCommand(BaseModel):
    mode: str
    command: str
    context: str
    message: Optional[str] = None
    apiKey: str
