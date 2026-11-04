-- Allow baked GLB clouds as an asset type.
alter table public.products drop constraint if exists products_asset_type_check;
alter table public.products add constraint products_asset_type_check check (asset_type in ('bin','image','cloud'));
