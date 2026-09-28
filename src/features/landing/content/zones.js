// Zone key -> [English label, Arabic label], used by the HUD pill and passed
// to `flyTo(zone)` on the 3D background. Ported verbatim from
// `VARELO Tokenized Station.dc.html`.
export const ZONES = {
  hero: ['Dubai Elite Oasis · Station', 'دبي إليت أوايسس · المحطة'],
  overview: ['Whole station', 'المحطة كاملة'],
  aerial: ['Site from above', 'الموقع من الأعلى'],
  plot: ['Land & station building', 'الأرض ومبنى المحطة'],
  fuel_canopy_3: ['Fuel canopies', 'مظلات الوقود'],
  fuel_highway: ['Fuel canopies · from the highway', 'مظلات الوقود · من الطريق السريع'],
  atm_plaza: ['ATM plaza', 'ساحة الصرافات'],
  family_park: ['Family park', 'حديقة العائلة'],
  station_front: ['Station · from across the highway', 'المحطة · من الجهة المقابلة للطريق'],
  mart: ['Convenience store & mall', 'المتجر والمول'],
  car_wash: ['Auto-Glow Car Wash', 'مغسلة السيارات'],
  car_wash_inside: ['Car wash · from the pumps', 'مغسلة السيارات · من المضخات'],
  auto_service: ['Tyres, oil & lubricants', 'الإطارات والزيوت'],
  cafe: ['Café & tenant units', 'المقهى والمستأجرون'],
  pylon: ['Price totem', 'لوحة الأسعار'],
  fuel_canopy_1: ['Fuel Canopy A', 'مظلة الوقود A'],
  ev_charging: ['EV charging', 'شحن السيارات الكهربائية'],
  atm_crypto: ['BTC & crypto ATM', 'صراف العملات الرقمية'],
  atm_bank: ['Bank ATM', 'صراف البنك'],
  atm_deposit: ['Cash deposit', 'الإيداع النقدي'],
  fuel_canopy_4: ['Fuel Canopy D', 'مظلة الوقود D'],
};
