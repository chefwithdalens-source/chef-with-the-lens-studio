// Public Supabase settings for the booking form and the owner dashboard (owner.html).
// The publishable key is safe to share: Row Level Security (supabase/bookings.sql) lets
// visitors only ADD a booking; only the studio owner's signed-in email can read them.
window.STUDIO_BOOKINGS = {
  supabaseUrl: 'https://fyaqwjhovnsvgyuyelgl.supabase.co',
  supabaseKey: 'sb_publishable_A2vdluLwlZ7KsT7dYffXBQ_yUVSLsQ_',
};
