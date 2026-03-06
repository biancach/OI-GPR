import xarray as xr
import pandas as pd
from pathlib import Path

data_dir = Path('data')
subsample = 1  

for nc_file in sorted(data_dir.glob('AQUA_MODIS.*.nc')):
    ds = xr.open_dataset(nc_file)
    sst = ds['sst']

    # Parse filename for metadata
    parts = nc_file.stem.split('.')
    date_str = parts[1]
    
    if '_' in date_str:
        # Monthly: 20250501_20250531 -> 2025-05_monthly
        start, end = date_str.split('_')
        label = f"{start[:4]}-{start[4:6]}_monthly"
    else:
        # Daily: 20260301 -> 2026-03-01_daily
        label = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}_daily"

    # Subsample
    sst_sub = sst[::subsample, ::subsample]
    df = sst_sub.to_dataframe().dropna().reset_index()[['lat', 'lon', 'sst']]

    out_name = f"modis_sst_{label}.csv"
    df.to_csv(data_dir / out_name, index=False, float_format='%.4f')
    print(f"{nc_file.name} -> {out_name}  ({len(df)} pts)")

    ds.close()
