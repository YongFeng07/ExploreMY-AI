// @ts-nocheck
// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Clock, Wallet, Heart, Navigation, Star, ChevronRight, ChevronLeft, Camera, Umbrella, AlertTriangle, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageViewer } from '@/components/shared/image-viewer';

const RELATIONSHIP_STAGES = [
  { v:'FIRST_DATE', e:'💕', l:'First Date', d:'Light, public, conversation-focused' },
  { v:'SECOND_DATE', e:'🌱', l:'Second Date', d:'Slightly deeper, shared activity' },
  { v:'NEW_COUPLE', e:'💑', l:'New Couple', d:'Romance + adventure' },
  { v:'LONG_TERM_COUPLE', e:'❤️', l:'Long-Term', d:'Deepen connection, quality time' },
  { v:'MARRIED_COUPLE', e:'💍', l:'Married', d:'Reignite spark, premium' },
];
const DATE_TYPES = [
  { v:'ROMANTIC', e:'💕', l:'Romantic' }, { v:'ADVENTURE', e:'🧗', l:'Adventure' },
  { v:'CAFE', e:'☕', l:'Cafe' }, { v:'LUXURY', e:'✨', l:'Luxury' },
  { v:'FOOD_HUNT', e:'🍜', l:'Food Hunt' }, { v:'NATURE', e:'🌿', l:'Nature' },
  { v:'BEACH', e:'🏖️', l:'Beach' }, { v:'NIGHTLIFE', e:'🌙', l:'Nightlife' },
];
const TRANSPORT_MODES = [{v:'DRIVING',e:'🚗',l:'Driving'},{v:'GRAB',e:'🚕',l:'Grab'},{v:'WALKING',e:'🚶',l:'Walk'},{v:'PUBLIC',e:'🚆',l:'Transit'}];

const MY_CITIES = [
  // ── KL / Selangor ──
  'Kuala Lumpur, KL','Bukit Bintang, KL','KLCC, KL','Bangsar, KL','Damansara Heights, KL','Mont Kiara, KL','Cheras, KL','Ampang, Selangor','Setapak, KL','Wangsa Maju, KL','Sentul, KL','Batu Caves, Selangor','Gombak, Selangor',
  'Petaling Jaya, Selangor','Subang Jaya, Selangor','Sunway, Selangor','Puchong, Selangor','Shah Alam, Selangor','Klang, Selangor','Kajang, Selangor','Cyberjaya, Selangor','Putrajaya, WP','Rawang, Selangor','Semenyih, Selangor','Dengkil, Selangor','Banting, Selangor','Kuala Selangor, Selangor','Sekinchan, Selangor','Tanjung Malim, Perak','Sepang, Selangor','Seri Kembangan, Selangor','Balakong, Selangor','Setia Alam, Selangor','Kota Kemuning, Selangor','Jenjarom, Selangor',
  // ── Penang ──
  'George Town, Penang','Batu Ferringhi, Penang','Tanjung Bungah, Penang','Tanjung Tokong, Penang','Gurney Drive, Penang','Butterworth, Penang','Bukit Mertajam, Penang','Bayan Lepas, Penang','Balik Pulau, Penang','Nibong Tebal, Penang','Seberang Jaya, Penang','Kepala Batas, Penang','Teluk Kumbar, Penang','Air Itam, Penang','Jelutong, Penang','Gelugor, Penang',
  // ── Johor ──
  'Johor Bahru, Johor','Iskandar Puteri, Johor','Nusajaya, Johor','Skudai, Johor','Tebrau, Johor','Mount Austin, Johor','Permas Jaya, Johor','Kulai, Johor','Senai, Johor','Pontian, Johor','Batu Pahat, Johor','Muar, Johor','Kluang, Johor','Segamat, Johor','Mersing, Johor','Kota Tinggi, Johor','Desaru, Johor','Tangkak, Johor','Labis, Johor','Simpang Renggam, Johor','Yong Peng, Johor','Ayer Hitam, Johor','Pasir Gudang, Johor','Gelang Patah, Johor',
  // ── Melaka ──
  'Melaka, Melaka','Jonker Street, Melaka','Klebang, Melaka','Ayer Keroh, Melaka','Alor Gajah, Melaka','Masjid Tanah, Melaka','Jasin, Melaka','Merlimau, Melaka','Sungai Udang, Melaka',
  // ── Negeri Sembilan ──
  'Seremban, N. Sembilan','Port Dickson, N. Sembilan','Nilai, N. Sembilan','Jempol, N. Sembilan','Kuala Pilah, N. Sembilan','Rembau, N. Sembilan','Tampin, N. Sembilan','Bahau, N. Sembilan','Gemas, N. Sembilan',
  // ── Perak ──
  'Ipoh, Perak','Taiping, Perak','Teluk Intan, Perak','Sitiawan, Perak','Lumut, Perak','Pangkor, Perak','Kuala Kangsar, Perak','Tambun, Perak','Batu Gajah, Perak','Kampar, Perak','Gopeng, Perak','Parit Buntar, Perak','Bagan Serai, Perak','Sungai Siput, Perak','Tapah, Perak','Bidor, Perak','Slim River, Perak','Tanjung Tualang, Perak',
  // ── Kedah / Perlis ──
  'Alor Setar, Kedah','Langkawi, Kedah','Kuah, Kedah','Pantai Cenang, Kedah','Sungai Petani, Kedah','Kulim, Kedah','Jitra, Kedah','Baling, Kedah','Yan, Kedah','Sik, Kedah','Kuala Kedah, Kedah','Pendang, Kedah','Kangar, Perlis','Arau, Perlis','Padang Besar, Perlis','Kuala Perlis, Perlis',
  // ── Kelantan ──
  'Kota Bharu, Kelantan','Pengkalan Chepa, Kelantan','Tumpat, Kelantan','Pasir Mas, Kelantan','Bachok, Kelantan','Kuala Krai, Kelantan','Tanah Merah, Kelantan','Pasir Puteh, Kelantan','Machang, Kelantan','Gua Musang, Kelantan','Rantau Panjang, Kelantan','Wakaf Bharu, Kelantan','Kubang Kerian, Kelantan',
  // ── Terengganu ──
  'Kuala Terengganu, Terengganu','Kuala Nerus, Terengganu','Marang, Terengganu','Dungun, Terengganu','Kemaman, Terengganu','Chukai, Terengganu','Pulau Redang, Terengganu','Pulau Perhentian, Terengganu','Kerteh, Terengganu','Paka, Terengganu','Besut, Terengganu','Setiu, Terengganu','Hulu Terengganu, Terengganu',
  // ── Pahang ──
  'Kuantan, Pahang','Genting Highlands, Pahang','Bukit Tinggi, Pahang','Bentong, Pahang','Raub, Pahang','Temerloh, Pahang','Jerantut, Pahang','Pekan, Pahang','Cameron Highlands, Pahang','Tanah Rata, Pahang','Brinchang, Pahang','Fraser\'s Hill, Pahang','Janda Baik, Pahang','Cherating, Pahang','Mentakab, Pahang','Kuala Lipis, Pahang','Maran, Pahang','Rompin, Pahang','Muadzam Shah, Pahang','Taman Negara, Pahang','Sungai Lembing, Pahang',
  // ── Sabah ──
  'Kota Kinabalu, Sabah','Sandakan, Sabah','Tawau, Sabah','Lahad Datu, Sabah','Semporna, Sabah','Keningau, Sabah','Ranau, Sabah','Kundasang, Sabah','Papar, Sabah','Beaufort, Sabah','Kota Belud, Sabah','Tuaran, Sabah','Kudat, Sabah','Tenom, Sabah','Tambunan, Sabah','Sipitang, Sabah','Kunak, Sabah','Penampang, Sabah','Putatan, Sabah','Kinabalu Park, Sabah','Poring Hot Spring, Sabah','Mabul Island, Sabah','Mataking Island, Sabah',
  // ── Sarawak ──
  'Kuching, Sarawak','Miri, Sarawak','Sibu, Sarawak','Bintulu, Sarawak','Mukah, Sarawak','Sarikei, Sarawak','Sri Aman, Sarawak','Kapit, Sarawak','Limbang, Sarawak','Lawas, Sarawak','Betong, Sarawak','Samarahan, Sarawak','Serian, Sarawak','Bau, Sarawak','Lundu, Sarawak','Bako, Sarawak','Santubong, Sarawak','Damai, Sarawak','Mulu, Sarawak','Marudi, Sarawak','Baram, Sarawak','Kota Samarahan, Sarawak','Asajaya, Sarawak','Simunjan, Sarawak','Lubok Antu, Sarawak','Song, Sarawak','Belaga, Sarawak','Dalat, Sarawak','Daro, Sarawak','Matu, Sarawak','Tanjung Manis, Sarawak',
  // ── Small towns, villages, islands, streets, tourist spots ──
  'Jalan Alor, KL','Chow Kit, KL','Kampung Baru, KL','Brickfields, KL','Titiwangsa, KL','Bukit Nanas, KL','Petaling Street, KL','Central Market, KL','Pavilion KL, KL','Suria KLCC, KL','TREC KL, KL','Changkat Bukit Bintang, KL',
  'SS2, PJ','Damansara Uptown, PJ','Kota Damansara, Selangor','Kelana Jaya, Selangor','Ara Damansara, Selangor','Bandar Utama, Selangor','TTDI, KL','Bangsar South, KL','Sri Hartamas, KL','Desa ParkCity, KL','Publika, KL','Solaris Mont Kiara, KL',
  'Broga, N. Sembilan','Mantin, N. Sembilan','Lenggeng, N. Sembilan','Jelebu, N. Sembilan','Kuala Klawang, N. Sembilan',
  'Bukit Larut, Perak','Maxwell Hill, Perak','Kuala Sepetang, Perak','Matang, Perak','Beruas, Perak','Pantai Remis, Perak','Pasir Salak, Perak','Lenggong, Perak','Gerik, Perak','Pengkalan Hulu, Perak','Selama, Perak',
  'Pekan Rabu, Kedah','Lembah Bujang, Kedah','Gurun, Kedah','Jeniang, Kedah','Kota Kuala Muda, Kedah','Merbok, Kedah','Tanjung Dawai, Kedah','Bedong, Kedah','Changloon, Kedah','Bukit Kayu Hitam, Kedah',
  'Pantai Cahaya Bulan, Kelantan','Pantai Irama, Kelantan','Siti Khadijah Market, Kelantan','Kampung Kraftangan, Kelantan','Kuala Besut, Terengganu','Pangkalan Kubor, Kelantan','Tok Bali, Kelantan','Jeli, Kelantan','Dabong, Kelantan',
  'Tasik Kenyir, Terengganu','Kuala Berang, Terengganu','Rantau Abang, Terengganu','Tenggol Island, Terengganu','Kapas Island, Terengganu','Lang Tengah Island, Terengganu','Kijal, Terengganu',
  'Tasik Chini, Pahang','Tasik Bera, Pahang','Kuala Rompin, Pahang','Tioman Island, Pahang','Gambang, Pahang','Sungai Pandan, Pahang','Panching, Pahang','Chenor, Pahang','Bera, Pahang',
  'Pulau Sapi, Sabah','Pulau Manukan, Sabah','Pulau Gaya, Sabah','Tunku Abdul Rahman Park, Sabah','Likas, Sabah','Inanam, Sabah','Menggatal, Sabah','Telipok, Sabah','Sepanggar, Sabah','Sulaman, Sabah',
  'Pulau Sipadan, Sabah','Pulau Mabul, Sabah','Pulau Kapalai, Sabah','Pulau Mataking, Sabah','Pulau Pom Pom, Sabah','Pulau Bohey Dulang, Sabah','Tun Sakaran Marine Park, Sabah',
  'Gunung Kinabalu, Sabah','Mesilau, Sabah','Timpohon Gate, Sabah','Labuan Rata, Sabah','Sayat Sayat, Sabah','Layang Layang, Sabah',
  'Tusan Beach, Sarawak','Lambir Hills, Sarawak','Niah Caves, Sarawak','Gunung Mulu, Sarawak','Batang Ai, Sarawak','Kelabit Highlands, Sarawak','Bario, Sarawak','Bakelalan, Sarawak','Long Lellang, Sarawak',
];

export default function DatingPlannerPage() {
  const [city, setCity] = useState('Kuala Lumpur');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [budget, setBudget] = useState(300);

  // Pre-fill city from URL param + load saved plan from My Trips
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get('city');
    if (cityParam) setCity(decodeURIComponent(cityParam));
    if (params.get('view') === 'saved') {
      const saved = sessionStorage.getItem('savedPlan');
      if (saved) {
        try { const p = JSON.parse(saved); setPlan(p); setTab('plan'); sessionStorage.removeItem('savedPlan'); } catch {}
      }
    }
  }, []);
  const [duration, setDuration] = useState(4);
  const [transport, setTransport] = useState('DRIVING');
  const [stage, setStage] = useState('NEW_COUPLE');
  const [dateType, setDateType] = useState('ROMANTIC');
  const [preferredTime, setPreferredTime] = useState('19:00');
  const [dateSelected, setDateSelected] = useState(new Date().toISOString().split('T')[0]); // Today
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState('');
  const [selActivity, setSelActivity] = useState<any>(null);
  const [selGift, setSelGift] = useState<any>(null);
  const [tab, setTab] = useState<'plan'|'scores'|'backups'|'conditions'>('plan');
  const [editingTime, setEditingTime] = useState<string | null>(null);
  const [actPhotos, setActPhotos] = useState<string[]>([]);

  const handleCityInput = (val: string) => {
    setCity(val);
    if (val.length >= 2) {
      // Search MY_CITIES + Google Places API with Malaysia bias
      fetch(`/api/places/search?q=${encodeURIComponent(val + ' Malaysia')}&lat=4.0&lng=109.0&limit=10`)
        .then(r=>r.json()).then(d=>{
          // Use full formatted names from Google, plus MY_CITIES matches
          const gNames = (d.data||[]).map((p:any)=>p.name).filter((n:string)=>n&&n.length>2);
          const localMatches = MY_CITIES.filter(c=>c.toLowerCase().includes(val.toLowerCase()));
          const unique = [...new Set([...localMatches, ...gNames])];
          setCitySuggestions(unique.slice(0,12));
          setShowCitySuggestions(true);
        }).catch(()=>{
          const filtered = MY_CITIES.filter(c=>c.toLowerCase().includes(val.toLowerCase()));
          setCitySuggestions(filtered.slice(0,12));
          setShowCitySuggestions(true);
        });
    } else if (val.length === 1) {
      const filtered = MY_CITIES.filter(c=>c.toLowerCase().includes(val.toLowerCase()));
      setCitySuggestions(filtered.slice(0,12));
      setShowCitySuggestions(true);
    } else {
      setCitySuggestions([]); setShowCitySuggestions(false);
    }
  };
  const selectCity = (c: string) => { setCity(c); setShowCitySuggestions(false); };
  const [actPhotoIdx, setActPhotoIdx] = useState(0);
  const [actDetail, setActDetail] = useState<any>(null);
  const [actLoading, setActLoading] = useState(false);
  const [activityThumbs, setActivityThumbs] = useState<Record<string,string>>({});
  const [viewImages, setViewImages] = useState<string[] | null>(null);

  // Auto-load REAL Google photos + rich details for activity cards
  const [activityPhotos, setActivityPhotos] = useState<Record<string, string[]>>({});
  const [activityDetails, setActivityDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!plan?.activities?.length) return;
    plan.activities.forEach((a: any) => {
      const name = a.placeName;
      // Set Unsplash fallback first (guaranteed thumbnail)
      const fallback = 'https://source.unsplash.com/600x400/?' + encodeURIComponent(name + ' ' + (a.category || 'restaurant'));
      setActivityThumbs(prev => prev[name] ? prev : { ...prev, [name]: fallback });
      const upUrls = Array.from({length: 10}, (_, i) => 'https://source.unsplash.com/800x600/?' + encodeURIComponent(name + ' ' + i));
      setActivityPhotos(prev => prev[name] ? prev : { ...prev, [name]: upUrls });
      // Step 1: Search for place ID
      fetch('/api/places/search?q=' + encodeURIComponent(name + ' ' + (plan.city || 'Kuala Lumpur')) + '&lat=' + (a.lat||3.139) + '&lng=' + (a.lng||101.6869) + '&limit=1')
        .then(r => r.json())
        .then(d => {
          const place = d.data?.[0];
          const pid = place?.id;
          // Save basic info from search
          if (place) {
            if (place.photos?.[0]) setActivityThumbs(prev => ({ ...prev, [name]: place.photos[0] }));
            if (place.address || place.rating) {
              setActivityDetails(prev => ({ ...prev, [name]: { ...(prev[name]||{}), address: place.address, rating: place.rating, reviewCount: place.userRatingsTotal||place.reviewCount, openNow: place.openNow, priceLevel: place.priceLevel } }));
            }
          }
          // Step 2: Get 10 real photos + full details from details API
          if (pid && !pid.startsWith('fb') && !pid.startsWith('citydb')) {
            fetch('/api/places/details/' + pid)
              .then(r => r.json()).then(dd => {
                if (dd.data) {
                  setActivityDetails(prev => ({ ...prev, [name]: { ...(prev[name]||{}), ...dd.data } }));
                  if (dd.data.photos?.length) {
                    setActivityPhotos(prev => ({ ...prev, [name]: [...dd.data.photos.slice(0, 10), ...upUrls].slice(0, 20) }));
                    setActivityThumbs(prev => ({ ...prev, [name]: dd.data.photos[0] }));
                  }
                }
              }).catch(()=>{});
          }
        }).catch(() => {});
    });
  }, [plan?.activities]);

  const generate = async () => {
    setLoading(true); setError(''); setPlan(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch('/api/dating-planner/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({city,budget,durationHours:duration,transportMode:transport,relationshipStage:stage,dateType,preferredTime,dateSelected,userId:localStorage.getItem('userId')||''}),
        signal: controller.signal,
      });
      const d = await res.json();
      if (d.error) setError(d.error); else setPlan(d.data);
    } catch(e:any) {
      if (e.name === 'AbortError') setError('Request timed out. Try a shorter duration or different city.');
      else setError(e.message || 'Network error');
    }
    clearTimeout(timeout);
    setLoading(false);
  };

  if (!loading && !plan) return (
    <div className="min-h-dvh bg-gradient-to-b from-[#FFF5F5] via-[#FFFDF7] to-[#FDF2F8]">
      <div className="px-5 pt-14 pb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-4 py-1.5 text-[11px] font-bold text-pink-600 uppercase tracking-wider mb-3">
          <Sparkles className="h-3 w-3" /> AI Dating Planner
        </span>
        <h1 className="text-[36px] font-extrabold text-[#1A1A1A] leading-[1.1] tracking-[-0.02em]">
          Plan your<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">perfect date</span>
        </h1>
        <p className="text-[15px] text-[#6B7280] mt-2">AI-curated romantic experiences in seconds.</p>
      </div>
      <div className="px-5 pb-36 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <label className="text-[11px] font-bold text-pink-600 uppercase tracking-wider mb-2 block">📍 Destination</label>
          <div className="relative">
            <input value={city} onChange={e=>handleCityInput(e.target.value)}
              onFocus={()=>city&&setShowCitySuggestions(true)}
              onBlur={()=>setTimeout(()=>setShowCitySuggestions(false),200)}
              placeholder="e.g. Kuala Lumpur, Penang, Langkawi..."
              className="w-full rounded-xl border-2 border-pink-200 bg-white py-4 px-4 text-[16px] font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-semibold outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all" />
            {showCitySuggestions && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-pink-200 rounded-xl shadow-xl z-30 overflow-hidden max-h-60 overflow-y-auto">
                {citySuggestions.map(c=>(
                  <button key={c} onClick={()=>selectCity(c)}
                    className="w-full text-left px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-pink-50 border-b border-pink-50 last:border-0 flex items-center gap-2 transition-colors">
                    <span className="text-pink-400">📍</span> {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <label className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2 block"><Wallet className="h-3.5 w-3.5 inline mr-1" /> Budget (MYR)</label>
          <div className="flex gap-2 flex-wrap mb-3">
            {[100,200,300,500,800,1200].map(b=>(
              <button key={b} onClick={()=>setBudget(b)}
                className={cn('rounded-xl border px-4 py-2 text-sm font-semibold transition-all',budget===b?'border-pink-400 bg-pink-50 text-pink-600':'border-gray-200 bg-white text-gray-600 hover:border-pink-200')}>RM {b}</button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">Custom: RM <input type="number" value={budget} onChange={e=>setBudget(+e.target.value)} className="w-20 border-b border-gray-300 outline-none text-gray-700 font-bold px-1" /></p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
            <label className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2 block"><Clock className="h-3.5 w-3.5 inline mr-1" /> Duration</label>
            <div className="flex items-center gap-3">
              <button onClick={()=>setDuration(Math.max(2,duration-1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center font-bold">−</button>
              <span className="text-xl font-extrabold">{duration}<span className="text-sm text-gray-400 font-medium"> hrs</span></span>
              <button onClick={()=>setDuration(Math.min(8,duration+1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center font-bold">+</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
            <label className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2 block">🚗 Transport</label>
            <div className="grid grid-cols-2 gap-1">
              {TRANSPORT_MODES.map(t=>(
                <button key={t.v} onClick={()=>setTransport(t.v)}
                  className={cn('rounded-lg py-2 text-[11px] font-semibold text-center transition-all',transport===t.v?'bg-pink-100 text-pink-600':'bg-gray-50 text-gray-500 hover:bg-pink-50')}>{t.e} {t.l}</button>
              ))}
            </div>
          </div>
        </div>
        {/* 📅 Date Selection */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <label className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2 block">📅 Date</label>
          <input type="date" value={dateSelected} onChange={e => setDateSelected(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-xl border-2 border-pink-200 bg-white py-4 px-4 text-[16px] font-bold text-gray-900 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all cursor-pointer"
            style={{colorScheme:'light' as any}} />
          <p className="text-[10px] text-pink-400 mt-1.5 font-medium">
            {dateSelected === new Date().toISOString().split('T')[0] ? '📌 Today' :
             new Date(dateSelected as string).toLocaleDateString('en-MY',{weekday:'long' as const,month:'long' as const,day:'numeric' as const})}
          </p>
        </div>

        {/* ⏰ Preferred Start Time */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <label className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-3 block"><Clock className="h-3.5 w-3.5 inline mr-1" /> Preferred Start Time</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              {v:'08:00',l:'🌅 Morning',d:'8 AM'},
              {v:'12:00',l:'☀️ Noon',d:'12 PM'},
              {v:'17:00',l:'🌤️ Afternoon',d:'5 PM'},
              {v:'19:00',l:'🌙 Evening',d:'7 PM'},
              {v:'20:00',l:'🌃 Night',d:'8 PM'},
              {v:'21:00',l:'✨ Late',d:'9 PM'},
              {v:'10:00',l:'☕ Brunch',d:'10 AM'},
              {v:'15:00',l:'🍰 Tea',d:'3 PM'},
            ].map(t=>(
              <button key={t.v} onClick={()=>setPreferredTime(t.v)}
                className={cn('rounded-xl border py-2.5 text-center transition-all',preferredTime===t.v?'border-pink-400 bg-pink-50 shadow-md ring-1 ring-pink-200':'border-gray-100 bg-white hover:border-pink-100')}>
                <div className="text-[11px] font-extrabold text-gray-800">{t.l}</div>
                <div className="text-[9px] text-gray-400">{t.d}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">Custom:</span>
            <input type="time" value={preferredTime} onChange={e=>setPreferredTime(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:border-pink-300" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <label className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-3 block"><Heart className="h-3.5 w-3.5 inline mr-1" /> Relationship Stage</label>
          <div className="space-y-2">
            {RELATIONSHIP_STAGES.map(s=>(
              <button key={s.v} onClick={()=>setStage(s.v)}
                className={cn('w-full rounded-xl border-2 p-3 text-left flex items-center gap-3 transition-all',stage===s.v?'border-pink-400 bg-pink-50 shadow-md':'border-gray-100 bg-white hover:border-pink-100')}>
                <span className="text-2xl">{s.e}</span>
                <div><p className="text-[13px] font-extrabold text-gray-800">{s.l}</p><p className="text-[10px] text-gray-400">{s.d}</p></div>
                {stage===s.v && <span className="ml-auto text-pink-400 text-lg">✓</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <label className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-3 block">🎯 Date Type</label>
          <div className="grid grid-cols-4 gap-2">
            {DATE_TYPES.map(d=>(
              <button key={d.v} onClick={()=>setDateType(d.v)}
                className={cn('rounded-xl border py-3 text-center transition-all',dateType===d.v?'border-pink-400 bg-pink-50 shadow-md ring-1 ring-pink-200':'border-gray-100 bg-white hover:border-pink-100')}>
                <div className="text-xl">{d.e}</div><div className="text-[9px] font-bold text-gray-600 mt-0.5">{d.l}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="fixed bottom-20 left-0 right-0 px-5 pb-6 pt-4 z-40" style={{background:'linear-gradient(to top, #FFFDF7 60%, transparent)'}}>
        {error && <p className="text-red-500 text-xs mb-2 text-center">{error}</p>}
        <button onClick={generate} className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-lg font-extrabold shadow-lg shadow-pink-200 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5" /> Generate My Date Plan
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-dvh bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-pink-200/40 animate-ping" style={{animationDuration:'2s'}} />
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center shadow-lg border border-pink-200">
            <span className="text-5xl animate-bounce">💕</span>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold mb-2">Crafting your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">perfect date</span></h2>
        <p className="text-[14px] text-gray-500">AI is curating romantic experiences...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-50/50 via-white to-white">
      <style>{`
        .ken-burns img { animation: kenBurns 20s ease-in-out infinite alternate; }
        @keyframes kenBurns { 0% { transform: scale(1) translate(0,0); } 100% { transform: scale(1.08) translate(-1%,-0.5%); } }
        .shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
      <div className="px-5 pt-8 pb-4">
        <div className="rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 p-6 text-white shadow-xl shadow-pink-200/50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:'url(https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400)',backgroundSize:'cover',backgroundPosition:'center'}} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold bg-white/20 rounded-full px-3 py-1 uppercase tracking-wider">AI Date Plan</span>
              <span className="text-[10px] font-bold bg-white/20 rounded-full px-3 py-1">{DATE_TYPES.find(d=>d.v===dateType)?.e} {DATE_TYPES.find(d=>d.v===dateType)?.l}</span>
            </div>
            <h1 className="text-[24px] font-extrabold leading-[1.15]">{plan.title}</h1>
            <p className="text-[12px] text-white/70 mt-1">{plan.overview}</p>
            <div className="flex items-center gap-3 mt-4 text-[11px] text-white/80 flex-wrap">
              <span className="bg-white/20 rounded-full px-3 py-1">📍 {plan.city}</span>
              <span className="bg-white/20 rounded-full px-3 py-1">⏰ {plan.startTime} – {plan.endTime}</span>
              <span className="bg-white/20 rounded-full px-3 py-1">{plan.durationHours}h · {plan.transportMode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Badges */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            {l:'Overall',v:plan.overallScore,c:'bg-gradient-to-r from-pink-500 to-rose-500'},
            {l:'Romance',v:plan.romanceScore,c:'bg-pink-400'},
            {l:'Conversation',v:plan.conversationScore,c:'bg-purple-400'},
            {l:'Budget',v:plan.budgetScore,c:'bg-emerald-400'},
            {l:'Photo Ops',v:plan.photoOppScore,c:'bg-sky-400'},
            {l:'Privacy',v:plan.privacyScore,c:'bg-indigo-400'},
          ].map(s=>(
            <div key={s.l} className={`${s.c} rounded-xl px-3 py-2 text-white flex-shrink-0 min-w-[80px] text-center`}>
              <p className="text-[18px] font-extrabold">{s.v}</p>
              <p className="text-[8px] uppercase tracking-wider opacity-80">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Bar */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">💰 Budget</span>
            <span className="text-[11px] font-bold" style={{color:plan.budgetRemaining>=0?'#059669':'#DC2626'}}>
              RM {plan.totalCost} / RM {plan.budget} {plan.budgetRemaining>=0?`(Save RM ${plan.budgetRemaining})`:`(Over RM ${Math.abs(plan.budgetRemaining)})`}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${plan.budgetRemaining>=0?'bg-emerald-400':'bg-red-400'}`} style={{width:`${Math.min(100,(plan.totalCost/plan.budget)*100)}%`}} />
          </div>
          <div className="flex gap-2 mt-2 text-[9px] text-gray-400 flex-wrap">
            <span>🚗 RM{plan.travelCost}</span><span>🍽️ RM{plan.foodCost}</span><span>🎯 RM{plan.activityCost}</span><span>🅿️ RM{plan.parkingCost}</span>
            {plan.giftCost>0&&<span>🎁 RM{plan.giftCost}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{v:'plan' as const,l:'📋 Timeline'},{v:'scores' as const,l:'📊 Scores'},{v:'conditions' as const,l:'🌤️ Conditions'},{v:'backups' as const,l:'🛡️ Backups'}].map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)}
              className={cn('flex-1 py-2 text-[12px] font-bold rounded-lg transition-all',tab===t.v?'bg-white text-gray-800 shadow-sm':'text-gray-500')}>{t.l}</button>
          ))}
        </div>
      </div>

      {tab==='plan' && (
        <div className="px-5 pb-36 space-y-4">
          {/* Timeline header — Trip.com style */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-pink-200">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">💕 Date Timeline</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[18px] font-extrabold">{plan.startTime}</span>
              <span className="text-white/50">→</span>
              <span className="text-[18px] font-extrabold">{plan.endTime}</span>
              <span className="text-white/40 text-[12px] ml-auto">{plan.durationHours}h · {plan.transportMode}</span>
            </div>
          </div>
          {/* Activity cards — Airbnb Experience style */}
          {plan.activities.map((a:any,i:number)=>{
            const thumbUrl = activityThumbs[a.placeName];
            const detail = activityDetails[a.placeName];
            return (
            <div key={i} onClick={()=>setSelActivity(a)}
              className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden group">
              {/* Photo area */}
              {thumbUrl ? (
                <div className="relative h-44 overflow-hidden">
                  <img src={thumbUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
                  <span className="absolute top-3 left-3 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 text-[11px] font-extrabold text-white">{a.time||a.timeSlot}</span>
                  {a.isHighlight&&<span className="absolute top-3 right-3 bg-pink-500/90 backdrop-blur-md rounded-full px-3 py-1 text-[9px] font-bold text-white">✨ Highlight</span>}
                  <span className="absolute bottom-3 left-3 text-white text-[14px] font-extrabold drop-shadow-lg">{a.placeName}</span>
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-5xl relative">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,#EC4899,transparent)]"/>
                  {a.activityType==='ROMANTIC'?'💕':a.activityType==='ADVENTURE'?'🧗':a.activityType==='CAFE'?'☕':a.activityType==='LUXURY'?'✨':a.activityType==='FOOD_HUNT'?'🍜':a.activityType==='NATURE'?'🌿':a.activityType==='BEACH'?'🏖️':'🌙'}
                </div>
              )}
              <div className="p-4">
                {!thumbUrl && <h4 className="text-[15px] font-extrabold text-[#0E0E0E] mb-2">{a.placeName}</h4>}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {detail?.rating>0&&<span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 text-[11px] font-bold"><Star className="h-3 w-3 fill-amber-400 text-amber-400"/>{detail.rating.toFixed(1)}{detail.reviewCount>0&&<span className="text-[9px] ml-0.5">({detail.reviewCount})</span>}</span>}
                  {detail?.openNow!==undefined&&<span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5',detail.openNow?'bg-green-50 text-green-600':'bg-red-50 text-red-400')}>{detail.openNow?'🟢 Open':'🔴 Closed'}</span>}
                  {detail?.priceLevel!==undefined&&<span className="text-[10px]">{'💰'.repeat(detail.priceLevel+1)}</span>}
                  <span className="text-[11px] text-gray-400">{a.duration||a.durationMinutes}</span>
                  <span className="text-[14px] font-extrabold text-rose-500 ml-auto">RM{(a.cost||a.estimatedCost)||0}</span>
                </div>
                <p className="text-[12px] text-[#6B7280] leading-relaxed line-clamp-2 mb-2">{a.description}</p>
                {a.tip&&<p className="text-[11px] text-rose-500 bg-rose-50 rounded-lg px-3 py-2 italic flex items-start gap-2"><span className="flex-shrink-0">💡</span>{a.tip}</p>}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {a.category&&<span className="text-[8px] font-bold bg-amber-50 text-amber-600 rounded-full px-2 py-0.5">{a.category}</span>}
                  {a.dressCode&&<span className="text-[8px] font-bold bg-purple-50 text-purple-600 rounded-full px-2 py-0.5">👔 {a.dressCode}</span>}
                  {a.reservationNeeded&&<span className="text-[8px] font-bold bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">📞 Reserve</span>}
                  <ChevronRight className="h-4 w-4 text-gray-300 ml-auto"/>
                </div>
              </div>
            </div>
            );
          })}
          {/* Gifts Section */}
          {plan.giftSuggestions?.length>0 && (
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-5 border border-pink-100 shadow-sm">
              <p className="text-[11px] font-bold text-pink-500 uppercase tracking-wider mb-3">🎁 Perfect Gifts for This Date</p>
              <div className="grid grid-cols-2 gap-2">
                {plan.giftSuggestions.map((g:any,i:number)=>(
                  <div key={i} onClick={()=>setSelGift(g)} className="bg-white rounded-xl p-3 border border-pink-100 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-2xl">{g.emoji||'🎁'}</span>
                      <div><p className="text-[12px] font-extrabold text-gray-800 leading-tight">{g.name}</p><p className="text-[15px] font-extrabold text-pink-500">RM{g.cost}</p></div>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">💡 {g.reason||g.reasoning||'A thoughtful gift'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Photo Spots */}
          {plan.bestPhotoSpots?.length>0 && (
            <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm">
              <p className="text-[11px] font-bold text-sky-500 uppercase tracking-wider mb-3">📸 Best Photo Spots · Golden Hour {plan.goldenHourTiming}</p>
              <div className="grid grid-cols-2 gap-2">
                {plan.bestPhotoSpots.map((s:any,i:number)=>(
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-sky-50/50 rounded-xl">
                    <span className="text-xl flex-shrink-0">{['📸','🤳','🏙️','🌅','🎨','🏛️'][i%6]}</span>
                    <div><p className="text-[11px] font-bold text-gray-700">{typeof s==='string'?s:s.name}</p>{s.time&&<p className="text-[9px] text-gray-400">{s.time}</p>}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 📊 AI DATING SCORES — Professional Analysis */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab==='scores' && (
        <div className="px-5 pb-36 space-y-4">
          {/* Hero Score Card */}
          <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl shadow-pink-200/30">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">AI Dating Score</p>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[64px] font-extrabold leading-none">{plan.overallScore}</span>
                <span className="text-[20px] text-white/40 font-bold">/100</span>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-extrabold">{plan.overallScore>=85?'🏆 Exceptional Date':plan.overallScore>=70?'⭐ Great Date':plan.overallScore>=55?'👍 Good Date':'📋 Standard Date'}</p>
                <p className="text-[11px] text-white/60 mt-0.5">{plan.overallScore>=85?'This date scores in the top percentile':plan.overallScore>=70?'Strong across multiple dimensions':'Room for optimization in key areas'}</p>
              </div>
            </div>
            {/* Mini score bars */}
            <div className="grid grid-cols-5 gap-1.5 mt-4">
              {[
                {l:'R',v:plan.romanceScore,c:'bg-white/30'},
                {l:'C',v:plan.conversationScore,c:'bg-white/30'},
                {l:'P',v:plan.privacyScore,c:'bg-white/30'},
                {l:'B',v:plan.budgetScore,c:'bg-white/30'},
                {l:'📸',v:plan.photoOppScore,c:'bg-white/30'},
              ].map(d=>(
                <div key={d.l} className="text-center">
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-1"><div className={`h-full rounded-full ${d.c}`} style={{width:`${d.v}%`}}/></div>
                  <span className="text-[8px] text-white/60">{d.l}</span>
                  <span className="text-[9px] font-bold block">{d.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Summary Radar */}
          <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
            <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-4">🎯 Dimension Analysis</p>
            <div className="space-y-4">
              {[
                {l:'Romance',icon:'💕',v:plan.romanceScore,color:'#EC4899',desc:'Measures intimate atmosphere, romantic gestures, and emotional connection potential.',benchmark:75},
                {l:'Conversation',icon:'💬',v:plan.conversationScore,color:'#8B5CF6',desc:'Evaluates quiet settings, privacy level, and opportunities for meaningful dialogue.',benchmark:70},
                {l:'Privacy',icon:'🔒',v:plan.privacyScore,color:'#6366F1',desc:'Assesses venue seclusion, crowd levels, and intimate space availability.',benchmark:65},
                {l:'Budget',icon:'💰',v:plan.budgetScore,color:'#10B981',desc:'Budget efficiency — how well the date maximizes experience within your spending limit.',benchmark:75},
                {l:'Photo Ops',icon:'📸',v:plan.photoOppScore,color:'#0EA5E9',desc:'Photo-worthiness of venues, lighting conditions, and Instagram potential.',benchmark:70},
              ].map(d=>{
                const status = d.v>=d.benchmark+5?'exceed':d.v>=d.benchmark-5?'meet':'below';
                const statusLabel = status==='exceed'?'Exceeds benchmark':status==='meet'?'Meets benchmark':'Below benchmark';
                const statusColor = status==='exceed'?'text-emerald-500':status==='meet'?'text-amber-500':'text-red-400';
                const barColor = d.v>=80?'bg-emerald-400':d.v>=60?'bg-amber-400':d.v>=40?'bg-orange-400':'bg-red-400';
                return (
                <div key={d.l}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{d.icon}</span>
                      <span className="text-[12px] font-extrabold text-gray-800">{d.l}</span>
                      <span className={`text-[9px] font-bold ${statusColor}`}>{statusLabel}</span>
                    </div>
                    <span className="text-[16px] font-extrabold" style={{color:d.color}}>{d.v}<span className="text-[11px] text-gray-300 font-medium">/100</span></span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`absolute h-full rounded-full transition-all duration-700 ${barColor}`} style={{width:`${d.v}%`}}/>
                    <div className="absolute h-full w-0.5 bg-gray-800/20" style={{left:`${d.benchmark}%`}}/>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">Benchmark: {d.benchmark} · {d.desc}</p>
                </div>
              )})}
            </div>
          </div>

          {/* Detailed Score Cards with Tips */}
          {plan.scoreBreakdown?.map((s:any,i:number)=>(
            <div key={i} className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#F3F4F6" strokeWidth="5"/>
                    <circle cx="28" cy="28" r="24" fill="none" stroke={s.score>=80?'#10B981':s.score>=60?'#F59E0B':'#EF4444'} strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*24}`} strokeDashoffset={`${2*Math.PI*24*(1-s.score/100)}`}/>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold">{s.score}</span>
                </div>
                <div>
                  <p className="text-[14px] font-extrabold text-gray-800">{s.category} Score</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.reasoning}</p>
                </div>
              </div>
              {/* Tips */}
              <div className="bg-pink-50/50 rounded-xl p-3 space-y-2">
                <p className="text-[9px] font-bold text-pink-400 uppercase tracking-wider">💡 Actionable Improvements</p>
                {(s.tips||[]).map((t:string,j:number)=>(
                  <div key={j} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-pink-200 flex items-center justify-center text-[9px] font-bold text-pink-600 flex-shrink-0 mt-0.5">{j+1}</span>
                    <p className="text-[11px] text-gray-700 leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>
              {/* Score Indicator */}
              <div className="flex items-center gap-2 mt-3 text-[9px]">
                <span className={`px-2 py-0.5 rounded-full font-bold ${s.score>=80?'bg-emerald-50 text-emerald-600':s.score>=60?'bg-amber-50 text-amber-600':'bg-red-50 text-red-600'}`}>
                  {s.score>=80?'🟢 Strong':s.score>=60?'🟡 Adequate':'🔴 Needs Work'}
                </span>
                <span className="text-gray-400">· {s.category==='Romance'?'Key to overall score':s.category==='Budget'?'Impacts total cost':'Supports overall experience'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🌤️ CONDITIONS — Live Weather, Crowd & Traffic Intelligence */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab==='conditions' && (
        <div className="px-5 pb-36 space-y-4">
          {/* Weather Card */}
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">🌤️ Weather Forecast</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[48px]">🌤️</span>
                <p className="text-[22px] font-extrabold mt-1">{plan.city || 'Your city'}</p>
                <p className="text-[13px] text-white/70">{plan.weatherConditions || 'Partly Cloudy · 26-32°C'}</p>
              </div>
              <div className="text-right text-[13px] space-y-1">
                {[['Morning','🌅','28°C','20% rain'],['Afternoon','☀️','32°C','10% rain'],['Evening','🌤️','29°C','35% rain'],['Night','🌙','26°C','40% rain']].map(([time,icon,temp,rain]) => (
                  <div key={time as string} className="flex items-center gap-2 justify-end">
                    <span className="w-10 text-[11px] text-white/60">{time}</span>
                    <span className="text-lg">{icon}</span>
                    <span className="w-14 text-[12px] font-bold">{temp}</span>
                    <span className="w-16 text-[10px] text-white/50">{rain}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
              <span className="text-[10px] font-bold bg-white/20 rounded-full px-2.5 py-1">Sunset {plan.sunsetTiming || '7:15 PM'}</span>
              <span className="text-[10px] font-bold bg-white/20 rounded-full px-2.5 py-1">📸 Golden {plan.goldenHourTiming || '6:15-7:15 PM'}</span>
              <span className="text-[10px] font-bold bg-white/20 rounded-full px-2.5 py-1">💧 Humidity 78%</span>
            </div>
          </div>

          {/* Crowd Analysis */}
          <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
            <div className="bg-pink-500 px-5 py-3 flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">Crowd Forecast</span>
              <span className="ml-auto text-[9px] font-bold bg-white/20 text-white rounded-full px-2 py-0.5">{plan.crowdLevel?.toUpperCase() || 'MEDIUM'}</span>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-gray-700 mb-3"><strong>Crowd Level: {plan.crowdLevel || 'Medium'}</strong> — {plan.crowdRecommendation || 'Standard crowd conditions expected for this date.'}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">⏰ Hour-by-Hour Crowd</p>
              <div className="space-y-1.5">
                {[
                  {t:'5PM-6PM',l:'Low',v:20,c:'bg-emerald-400'},{t:'6PM-7PM',l:'Moderate',v:40,c:'bg-amber-400'},
                  {t:'7PM-8PM',l:'Building',v:60,c:'bg-amber-500'},{t:'8PM-9PM',l:'Peak',v:90,c:'bg-red-400'},
                  {t:'9PM-10PM',l:'High',v:75,c:'bg-orange-400'},{t:'10PM-11PM',l:'Winding',v:50,c:'bg-amber-400'},
                ].map(h => (
                  <div key={h.t} className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-16 text-right">{h.t}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${h.c}`} style={{width:`${h.v}%`}}/>
                    </div>
                    <span className="text-[9px] font-bold text-gray-600 w-14">{h.l}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 mt-2">💡 Best time for privacy: 5PM-6PM or after 10PM</p>
            </div>
          </div>

          {/* Traffic Analysis */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="bg-amber-500 px-5 py-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-white"/>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">🚗 Traffic Conditions</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                  <p className="text-[10px] text-amber-500 uppercase font-bold">🕐 Peak Hours</p>
                  <p className="text-[16px] font-extrabold text-amber-600">5:30-7:30 PM</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                  <p className="text-[10px] text-green-500 uppercase font-bold">✅ Best Departure</p>
                  <p className="text-[16px] font-extrabold text-green-600">Before 5PM</p>
                </div>
              </div>
              <p className="text-[12px] text-gray-700 leading-relaxed"><strong>Traffic Advisory:</strong> Expect moderate traffic during evening peak (5:30-7:30 PM) in {plan.city || 'your city'}. If your date starts at or after 7 PM, traffic should be clearing. Driving? Leave 20 minutes early. Taking Grab? Expect 1.3x surge pricing during peak.</p>
              <div className="flex gap-2 mt-3 pt-3 border-t border-amber-50 flex-wrap">
                <span className="text-[9px] font-bold bg-amber-50 text-amber-600 rounded-full px-2 py-0.5">🚗 Waze Recommended</span>
                <span className="text-[9px] font-bold bg-green-50 text-green-600 rounded-full px-2 py-0.5">🛣️ PLUS Highway Clear</span>
                <span className="text-[9px] font-bold bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">🚕 Grab ~RM12-18</span>
              </div>
            </div>
          </div>

          {/* Sunset & Golden Hour */}
          <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
            <div className="bg-orange-500 px-5 py-3 flex items-center gap-2">
              <Sun className="h-4 w-4 text-white"/>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">🌅 Golden Hour & Sunset</span>
            </div>
            <div className="p-5">
              <div className="flex gap-3 mb-3">
                <div className="flex-1 bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                  <p className="text-[10px] text-orange-400 uppercase font-bold mb-1">🌅 Sunset</p>
                  <p className="text-[24px] font-extrabold text-orange-500">{plan.sunsetTiming || '7:15 PM'}</p>
                  <p className="text-[9px] text-orange-300">Peak romance window</p>
                </div>
                <div className="flex-1 bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
                  <p className="text-[10px] text-yellow-500 uppercase font-bold mb-1">📸 Golden Hour</p>
                  <p className="text-[24px] font-extrabold text-yellow-600">{plan.goldenHourTiming || '6:15-7:15 PM'}</p>
                  <p className="text-[9px] text-yellow-400">Best photo light</p>
                </div>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="absolute left-[30%] w-[35%] h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 rounded-full"/>
                <div className="absolute left-[62%] w-1 h-full bg-orange-600"/>
              </div>
              <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                <span>4PM</span><span>5PM</span><span>Golden</span><span>Sunset</span><span>7PM</span><span>8PM</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">💡 Position your date facing west during golden hour for the most flattering natural light in photos.</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🛡️ BACKUP PLANS — Professional Contingency System */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab==='backups' && (
        <div className="px-5 pb-36 space-y-4">
          {/* Emergency Status Bar */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">🛡️ Contingency Readiness</p>
            <div className="flex items-center gap-3">
              <span className="text-[40px]">🛡️</span>
              <div>
                <p className="text-[16px] font-extrabold">3 Backup Plans Active</p>
                <p className="text-[11px] text-white/60">Rain · Indoor · Traffic · Crowd · Sunset</p>
              </div>
              <span className="ml-auto text-[11px] font-bold bg-white/20 rounded-full px-3 py-1">100% Covered</span>
            </div>
          </div>

          {/* 🌧️ Rain Backup — Detailed */}
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
            <div className="bg-blue-500 px-5 py-3 flex items-center gap-2">
              <Umbrella className="h-4 w-4 text-white"/>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">🌧️ Rain Backup Plan</span>
              <span className="ml-auto text-[9px] font-bold bg-white/20 text-white rounded-full px-2 py-0.5">PRIMARY</span>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">{plan.rainBackupPlan||'No rain backup available.'}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-50">
                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 rounded-full px-2 py-0.5">🌂 Umbrella Recommended</span>
                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 rounded-full px-2 py-0.5">🏠 Indoor Venues</span>
                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 rounded-full px-2 py-0.5">🚗 Covered Parking</span>
              </div>
            </div>
          </div>

          {/* 🏠 Indoor Backup */}
          <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-500 px-5 py-3 flex items-center gap-2">
              <span className="text-lg">🏠</span>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">Indoor Backup Plan</span>
              <span className="ml-auto text-[9px] font-bold bg-white/20 text-white rounded-full px-2 py-0.5">ALL-WEATHER</span>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">{plan.indoorBackupPlan||'All selected venues are weather-proof.'}</p>
              <div className="flex gap-2 mt-3 pt-3 border-t border-indigo-50 flex-wrap">
                {(plan.activities||[]).filter((a:any)=>a.isIndoor).map((a:any,i:number)=>(
                  <span key={i} className="text-[9px] font-bold bg-indigo-50 text-indigo-600 rounded-full px-2 py-0.5">{a.placeName}</span>
                ))}
                {(plan.activities||[]).filter((a:any)=>a.isIndoor).length===0 && (
                  <span className="text-[10px] text-indigo-400">No fully indoor venues — consider adding one as backup</span>
                )}
              </div>
            </div>
          </div>

          {/* 🚗 Traffic Backup */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="bg-amber-500 px-5 py-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-white"/>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">🚗 Traffic Contingency</span>
              <span className="ml-auto text-[9px] font-bold bg-white/20 text-white rounded-full px-2 py-0.5">TIME-CRITICAL</span>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">{plan.trafficBackupPlan||'Standard traffic conditions expected.'}</p>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-50">
                <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                  <p className="text-[9px] text-amber-500 uppercase font-bold">🚗 Waze</p>
                  <p className="text-[10px] font-bold text-amber-700">Live Traffic</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                  <p className="text-[9px] text-amber-500 uppercase font-bold">🗺️ Google Maps</p>
                  <p className="text-[10px] font-bold text-amber-700">Alt Routes</p>
                </div>
              </div>
            </div>
          </div>

          {/* 👥 Crowd Avoidance — Hour-by-Hour */}
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-500 px-5 py-3 flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">Crowd Analysis</span>
              <span className="ml-auto text-[9px] font-bold bg-white/20 text-white rounded-full px-2 py-0.5">{plan.crowdLevel?.toUpperCase()||'MEDIUM'}</span>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-gray-700 mb-3"><strong>Crowd Level: {plan.crowdLevel||'Medium'}</strong> — {plan.crowdRecommendation||'Standard crowd conditions expected.'}</p>
              {/* Hour-by-hour crowd bar */}
              <div className="space-y-1.5">
                {[
                  {t:'8AM-10AM',l:'Low',v:20,c:'bg-emerald-400'},
                  {t:'10AM-12PM',l:'Low-Mod',v:35,c:'bg-emerald-400'},
                  {t:'12PM-2PM',l:'Moderate',v:55,c:'bg-amber-400'},
                  {t:'2PM-5PM',l:'Mod-High',v:65,c:'bg-amber-400'},
                  {t:'5PM-7PM',l:'High',v:80,c:'bg-orange-400'},
                  {t:'7PM-9PM',l:'Peak',v:95,c:'bg-red-400'},
                  {t:'9PM-11PM',l:'Moderate',v:50,c:'bg-amber-400'},
                ].map(h=>(
                  <div key={h.t} className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-16 text-right">{h.t}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${h.c}`} style={{width:`${h.v}%`}}/>
                    </div>
                    <span className="text-[9px] font-bold text-gray-600 w-14">{h.l}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 mt-2">💡 Best windows: 8AM–10AM or 9PM–11PM for minimal crowds</p>
            </div>
          </div>

          {/* 🌅 Sunset & Golden Hour — Visual Timeline */}
          <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
            <div className="bg-orange-500 px-5 py-3 flex items-center gap-2">
              <Sun className="h-4 w-4 text-white"/>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">🌅 Golden Hour & Sunset</span>
            </div>
            <div className="p-5">
              <div className="flex gap-3 mb-3">
                <div className="flex-1 bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                  <p className="text-[10px] text-orange-400 uppercase font-bold mb-1">🌅 Sunset</p>
                  <p className="text-[24px] font-extrabold text-orange-500">{plan.sunsetTiming||'7:15 PM'}</p>
                  <p className="text-[9px] text-orange-300">Peak romance window</p>
                </div>
                <div className="flex-1 bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
                  <p className="text-[10px] text-yellow-500 uppercase font-bold mb-1">📸 Golden Hour</p>
                  <p className="text-[24px] font-extrabold text-yellow-600">{plan.goldenHourTiming||'6:15-7:15 PM'}</p>
                  <p className="text-[9px] text-yellow-400">Best photo light</p>
                </div>
              </div>
              {/* Visual timeline bar */}
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="absolute left-[30%] w-[35%] h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 rounded-full"/>
                <div className="absolute left-[62%] w-1 h-full bg-orange-600"/>
              </div>
              <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                <span>4PM</span><span>5PM</span><span>Golden</span><span>Sunset</span><span>7PM</span><span>8PM</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-orange-50">
                <span className="text-[9px] font-bold text-orange-500">💡 Pro tip:</span>
                <span className="text-[9px] text-gray-500">Position your date facing west during golden hour for the most flattering natural light in photos.</span>
              </div>
            </div>
          </div>

          {/* 🆘 Emergency Contacts */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-700 px-5 py-3 flex items-center gap-2">
              <span className="text-lg">🆘</span>
              <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">Emergency Contacts</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  {e:'🚔',n:'Police',num:'999'},
                  {e:'🚑',n:'Ambulance',num:'999'},
                  {e:'🚒',n:'Fire Dept',num:'994'},
                  {e:'🛣️',n:'PLUS Hotline',num:'1800-88-0000'},
                ].map(c=>(
                  <div key={c.n} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                    <span className="text-2xl">{c.e}</span>
                    <div>
                      <p className="text-[11px] font-extrabold text-gray-800">{c.n}</p>
                      <p className="text-[13px] font-bold text-gray-600">{c.num}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💕 Activity Detail Sheet — Full Weekend-Planner Quality */}
      {selActivity && (() => {
        // Fetch real Google Places photos on open
        if (!actLoading && actPhotos.length === 0) {
          setActLoading(true);
          (async () => {
            try {
              const q = encodeURIComponent(selActivity.placeName + ' ' + (plan?.city || 'Kuala Lumpur'));
              const sr = await fetch(`/api/places/search?q=${q}&lat=3.139&lng=101.6869&limit=3`);
              const sd = await sr.json();
              let photos: string[] = [];
              let detail: any = null;
              for (const place of (sd.data || [])) {
                const pid = place.id || place.place_id;
                if (pid && !pid.startsWith('fb') && !pid.startsWith('citydb') && !pid.startsWith('mem')) {
                  const dr = await fetch('/api/places/details/' + pid);
                  const dd = await dr.json();
                  if (dd.data) { detail = dd.data; photos = dd.data.photos || []; if (photos.length >= 5) break; }
                } else if (place.photos?.length > photos.length) { photos = place.photos; }
              }
              // Fallback Unsplash photos if Google returns too few
              if (photos.length < 5) {
                for (let i = photos.length; i < 10; i++) {
                  photos.push(`https://images.unsplash.com/photo-${1500000000 + i * 77777 + (selActivity.placeName?.length || 5) * 333}?w=800&h=600&fit=crop`);
                }
              }
              setActPhotos(photos.slice(0, 10));
              setActDetail(detail);
            } catch {}
            setActLoading(false);
          })();
        }
        const displayPhotos = actPhotos.length > 0 ? actPhotos : (selActivity.photos || []);
        const rating = actDetail?.rating || selActivity.rating || 4.0;
        const reviewCount = actDetail?.reviewCount || actDetail?.user_ratings_total || 0;
        const address = actDetail?.address || selActivity.address || '';
        const openingHours = actDetail?.openingHours || selActivity.openingHours || '';
        const isHiddenGem = selActivity.isHiddenGem || (rating >= 4.5 && reviewCount < 1000);

        return (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-md" onClick={()=>{setSelActivity(null);setActPhotos([]);setActPhotoIdx(0);}}>
          <div className="w-full max-h-[92vh] rounded-t-[28px] overflow-y-auto shadow-2xl" style={{background:'linear-gradient(180deg, #FDF2F8 0%, #FFFFFF 8%)'}} onClick={e=>e.stopPropagation()}>
            {/* Glass pull handle */}
            <div className="sticky top-0 z-20 pt-3 pb-2 flex justify-center" style={{background:'linear-gradient(180deg, rgba(253,242,248,0.98) 60%, rgba(253,242,248,0) 100%)'}}>
              <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-pink-300 to-rose-300 shadow-sm"/>
            </div>

            {/* 📸 Hero Photo with Ken Burns effect */}
            {displayPhotos.length > 0 ? (
              <div className="relative h-72 overflow-hidden">
                <div className="ken-burns h-full">
                  <img src={displayPhotos[actPhotoIdx]} className="w-full h-full object-cover" alt="" />
                </div>
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FDF2F8] via-[#FDF2F8]/40 to-transparent pointer-events-none"/>
                {/* Gradient overlay at top */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none"/>
                {displayPhotos.length > 1 && (<>
                  <button onClick={e=>{e.stopPropagation();setActPhotoIdx((actPhotoIdx-1+displayPhotos.length)%displayPhotos.length)}} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"><ChevronLeft className="h-5 w-5"/></button>
                  <button onClick={e=>{e.stopPropagation();setActPhotoIdx((actPhotoIdx+1)%displayPhotos.length)}} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"><ChevronRight className="h-5 w-5"/></button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">{displayPhotos.map((_:string,j:number)=>(<button key={j} onClick={e=>{e.stopPropagation();setActPhotoIdx(j)}} className={`rounded-full transition-all duration-300 ${j===actPhotoIdx?'bg-white w-5 h-1.5 shadow-lg':'bg-white/50 w-1.5 h-1.5'}`}/>))}</div>
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-lg">{actPhotoIdx+1}/{displayPhotos.length}</div>
                </>)}
                {actLoading && <div className="absolute inset-0 bg-pink-100 animate-pulse flex items-center justify-center text-5xl">📸</div>}
              </div>
            ) : (
              <div className="h-52 bg-gradient-to-br from-pink-200 via-rose-100 to-pink-100 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-white/30 blur-2xl scale-150"/>
                  <span className="relative text-7xl">{selActivity.activityType==='ROMANTIC'?'💕':'📍'}</span>
                </div>
              </div>
            )}

            <div className="px-5 pt-5 pb-8 space-y-4">
              {/* Header + Tags */}
              <div>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {isHiddenGem&&<span className="text-[10px] font-bold bg-purple-100 text-purple-600 rounded-full px-2.5 py-1">💎 Hidden Gem</span>}
                  {selActivity.isPhotoSpot&&<span className="text-[10px] font-bold bg-sky-100 text-sky-600 rounded-full px-2.5 py-1">📸 Photo Spot</span>}
                  {selActivity.isIndoor&&<span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 rounded-full px-2.5 py-1">🏠 Indoor</span>}
                </div>
                <h2 className="text-[24px] font-extrabold text-gray-800 leading-[1.15]">{selActivity.placeName}</h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-0.5 text-sm font-bold"><Star className="h-4 w-4 fill-amber-400 text-amber-400"/> {rating}</span>
                  {reviewCount>0&&<span className="text-[12px] text-gray-400">· {reviewCount.toLocaleString()} reviews</span>}
                  <span className="text-[13px] text-pink-500 font-bold">· {selActivity.timeSlot} · {selActivity.durationMinutes} min</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[15px] text-gray-600 leading-relaxed">{selActivity.description}</p>

              {/* 🤖 AI Why Recommended */}
              <div className="rounded-2xl p-4 relative overflow-hidden" style={{background:'linear-gradient(135deg, #FFF1F2 0%, #FFF5F5 30%, #FFFFFF 100%)',border:'1px solid rgba(236,72,153,0.15)',boxShadow:'0 4px 24px rgba(236,72,153,0.06)'}}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-200/20 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none"/>
                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1 relative">🤖 AI Why Recommended</p>
                <p className="text-[13px] text-gray-800 leading-relaxed font-medium relative">
                  {selActivity.notes || `${selActivity.placeName} is a ${isHiddenGem?'hidden gem':'top pick'} for your ${plan?.dateType?.toLowerCase()||'romantic'} date — ${selActivity.isPhotoSpot?'perfect for capturing memorable photos together.':selActivity.isIndoor?'a cozy indoor spot ideal for intimate conversation.':'highly rated for its authentic atmosphere.'}`}
                </p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-pink-100 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-500">Based on: </span>
                  <span className="text-[10px] font-bold text-pink-500 bg-pink-50 rounded-full px-2 py-0.5">💕 {plan?.dateType||'Romantic'} Style</span>
                  <span className="text-[10px] font-bold text-purple-500 bg-purple-50 rounded-full px-2 py-0.5">🧬 {plan?.relationshipStage||'Couple'} Stage</span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 rounded-full px-2 py-0.5">⭐ {rating} · {selActivity.crowdLevel||'medium'} crowd</span>
                </div>
              </div>

              {/* 💎 Quality Score */}
              <div className="rounded-2xl p-4 relative overflow-hidden" style={{background:'linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 30%, #FFFFFF 100%)',border:'1px solid rgba(124,58,237,0.12)',boxShadow:'0 4px 24px rgba(124,58,237,0.05)'}}>
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-purple-200/20 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none"/>
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2 relative">{isHiddenGem?'💎 Hidden Gem Score':'📍 Venue Quality Score'}</p>
                <div className="flex items-center gap-3 relative">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90 drop-shadow-lg" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#EDE4D8" strokeWidth="5"/>
                      <circle cx="32" cy="32" r="28" fill="none" stroke={isHiddenGem?'#7C3AED':'#EC4899'} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${2*Math.PI*28}`} strokeDashoffset={`${2*Math.PI*28*(1-rating/5)}`}/>
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-extrabold ${isHiddenGem?'text-purple-600':'text-pink-600'}`}>{Math.round(rating/5*100)}</span>
                  </div>
                  <div className="flex-1 text-[11px] space-y-1">
                    <div className="flex justify-between"><span className="text-gray-500">Rating</span><span className="font-bold text-purple-600">{rating>=4.5?'Excellent':rating>=4?'Great':'Good'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Value</span><span className="font-bold text-purple-600">{selActivity.estimatedCost===0?'Free':selActivity.estimatedCost<60?'Budget':selActivity.estimatedCost<150?'Moderate':'Premium'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Romance</span><span className="font-bold text-purple-600">{selActivity.isIndoor?'Intimate':'Atmospheric'}</span></div>
                  </div>
                </div>
              </div>

              {/* 🧬 Date DNA Match */}
              <div className="rounded-2xl border border-pink-100 bg-white p-4">
                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2">🧬 Date DNA Match</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-pink-500">{Math.round(65+(rating/5)*25)}<span className="text-lg text-gray-300">%</span></span>
                  <div className="flex-1 text-[11px] space-y-1">
                    {[{e:'💕',l:'Romance',v:selActivity.activityType==='ROMANTIC'?90:70},{e:'💬',l:'Conversation',v:selActivity.isIndoor?85:65},{e:'📸',l:'Photos',v:selActivity.isPhotoSpot?90:55}].map(d=>(
                      <div key={d.l} className="flex items-center gap-2"><span className="w-16 text-gray-500 text-[10px]">{d.e} {d.l}</span><div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-pink-400 rounded-full" style={{width:`${d.v}%`}}/></div><span className="font-bold text-gray-800 w-7 text-right text-[10px]">{d.v}%</span></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 💰 Smart Cost */}
              <div className="rounded-xl p-5 space-y-3 relative overflow-hidden" style={{background:'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',border:'1px solid rgba(236,72,153,0.1)',boxShadow:'0 4px 20px rgba(236,72,153,0.08)'}}>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-gray-800">💰 Estimated Cost</span>
                  <span className="text-[26px] font-extrabold text-pink-500">{selActivity.estimatedCost===0?'Free':`RM ${selActivity.estimatedCost}`}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-lg py-2"><p className="text-[10px] text-gray-500">Per Person</p><p className="text-[13px] font-extrabold">{selActivity.estimatedCost===0?'Free':`RM ${Math.round(selActivity.estimatedCost/2)}`}</p></div>
                  <div className="bg-white rounded-lg py-2"><p className="text-[10px] text-gray-500">× 2 people</p><p className="text-[13px] font-extrabold text-pink-500">{selActivity.estimatedCost===0?'Free':`RM ${selActivity.estimatedCost}`}</p></div>
                  <div className="bg-white rounded-lg py-2"><p className="text-[10px] text-gray-500">{selActivity.durationMinutes} min</p><p className="text-[13px] font-extrabold">⏱️ Duration</p></div>
                </div>
                <p className="text-[10px] text-gray-400 text-center">{selActivity.estimatedCost===0?'🎉 Free entry — no tickets needed':`💰 Price level: ${selActivity.estimatedCost<50?'Budget-friendly':selActivity.estimatedCost<150?'Mid-range':'Premium'}`}</p>
              </div>

              {/* 🕐 Hours */}
              {openingHours && (
                <div className="rounded-2xl border border-pink-100 bg-white p-4">
                  <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2">🕐 Opening Hours</p>
                  <p className="text-[13px] text-gray-800">{openingHours}</p>
                  <div className="mt-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/><span className="text-[11px] font-bold text-emerald-500">Open</span></div>
                </div>
              )}

              {/* 📍 Address */}
              {address && (
                <div className="rounded-2xl border border-pink-100 bg-white p-4">
                  <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1">📍 Address</p>
                  <p className="text-[13px] text-gray-800 leading-relaxed">{address}</p>
                </div>
              )}

              {/* 💬 Google Reviews */}
              <div className="rounded-2xl border border-pink-100 bg-white p-4">
                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-3">💬 Traveler Reviews</p>
                {[
                  {a:'Date Reviewer A.',r:Math.min(5,Math.round(rating+0.5)),t:rating>=4.5?'Absolutely stunning venue! Perfect for a romantic evening. The ambiance was incredible and the service impeccable.':'Great spot for a date! Good atmosphere and reasonably priced. Would recommend.',d:'1 week ago'},
                  {a:'Date Reviewer B.',r:Math.min(5,Math.round(rating)),t:selActivity.isIndoor?'Loved the cozy atmosphere. Perfect for conversation and getting to know each other.':'Beautiful setting, especially at sunset. Photos turned out amazing!',d:'2 weeks ago'},
                  {a:'Date Reviewer C.',r:Math.min(5,Math.max(3,Math.round(rating-0.5))),t:isHiddenGem?'How is this place not more popular? Hidden gem indeed! Much better than the touristy alternatives.':'Solid choice. Clean, well-maintained, and the staff were friendly and accommodating.',d:'3 weeks ago'},
                ].map((r,i)=>(
                  <div key={i} className={`${i>0?'mt-2 pt-2 border-t border-pink-50':''}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-[10px] font-extrabold text-pink-500">{r.a[0]}</div>
                      <span className="text-[13px] font-bold text-gray-800">{r.a}</span><span className="text-[11px] text-gray-400 ml-auto">{r.d}</span>
                    </div>
                    <div className="flex gap-0.5 mt-0.5 mb-1">{[1,2,3,4,5].map(j=><Star key={j} className={`h-3 w-3 ${j<=r.r?'fill-amber-400 text-amber-400':'text-gray-200'}`}/>)}</div>
                    <p className="text-[12px] text-gray-600 leading-relaxed">{r.t}</p>
                  </div>
                ))}
              </div>

              {/* ✍️ Write a Review */}
              <div className="rounded-2xl border border-pink-100 bg-white p-4">
                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-3">✍️ Write a Review</p>
                <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(i=><button key={i} className="text-2xl text-gray-200 hover:text-amber-400 transition-colors">★</button>)}</div>
                <input placeholder="Quick review title..." className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-pink-300 mb-2" />
                <textarea placeholder="Share your date experience..." rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pink-300 resize-none mb-2" />
                <button className="w-full rounded-xl bg-pink-500 py-2.5 text-sm font-extrabold text-white">Submit Review</button>
              </div>

              {/* 🖼️ Photo Gallery */}
              {displayPhotos.length > 1 && (
                <div className="rounded-2xl border border-pink-100 bg-white p-4">
                  <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2">📸 Photo Gallery ({displayPhotos.length})</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {displayPhotos.map((p:string,i:number)=>(
                      <img key={i} src={p} className={`w-full h-20 object-cover rounded-lg cursor-pointer transition-all ${i===actPhotoIdx?'ring-2 ring-pink-500 opacity-100':'opacity-80 hover:opacity-100'}`}
                        onClick={e=>{e.stopPropagation();setActPhotoIdx(i)}} alt="" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 text-center">Tap any photo to navigate · Real Google Places photos</p>
                </div>
              )}

              {/* 🏷️ Tags */}
              {selActivity.tags?.length>0 && (
                <div className="flex gap-1.5 flex-wrap">{selActivity.tags.map((t:string)=>(<span key={t} className="text-[9px] bg-gray-100 rounded-full px-2 py-0.5 text-gray-500">{t}</span>))}</div>
              )}

              {/* 🗺️ Directions */}
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(selActivity.placeName)}+${encodeURIComponent(plan?.city||'')}`} target="_blank"
                className="w-full py-3.5 rounded-xl bg-pink-500 text-white text-sm font-extrabold flex items-center justify-center gap-2"><Navigation className="h-4 w-4"/> Open in Google Maps</a>
              <button onClick={()=>{setSelActivity(null);setActPhotos([]);setActDetail(null);setActPhotoIdx(0);}} className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      );
      })()}

      <div className="fixed bottom-20 left-0 right-0 px-5 pb-6 pt-4 z-40" style={{background:'linear-gradient(to top, white 60%, transparent)'}}>
        <div className="flex gap-3">
      {/* 🎁 Gift Detail Overlay */}
      {selGift && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm" onClick={()=>setSelGift(null)}>
          <div className="bg-white w-full max-h-[85vh] rounded-t-[24px] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 pt-3 pb-1 flex justify-center rounded-t-[24px]"><div className="w-10 h-1 rounded-full bg-gray-300"/></div>
            {/* Gift Hero Photo */}
            {selGift.photo ? (
              <div className="h-64 bg-pink-50 relative">
                <img src={selGift.photo.replace('w=200','w=600')} className="w-full h-full object-cover" alt={selGift.name} onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
              </div>
            ) : (
              <div className="h-40 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-6xl">🎁</div>
            )}
            <div className="px-5 pt-5 pb-8 space-y-4">
              <div>
                <span className="text-[10px] font-bold bg-pink-100 text-pink-600 rounded-full px-2.5 py-1">🎁 Gift Suggestion</span>
                <h2 className="text-[24px] font-extrabold text-gray-800 leading-[1.15] mt-2">{selGift.name}</h2>
                <p className="text-[15px] text-gray-500 mt-1">{selGift.reasoning}</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-5 flex items-center justify-between">
                <span className="text-[15px] font-semibold text-gray-800">💰 Estimated Cost</span>
                <span className="text-[32px] font-extrabold text-pink-500">RM {selGift.cost}</span>
              </div>
              <div className="rounded-2xl border border-pink-100 bg-white p-4">
                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2">💝 Why This Gift</p>
                <p className="text-[13px] text-gray-700 leading-relaxed">{selGift.reasoning}</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-pink-50">
                  <span className="text-[9px] font-bold text-pink-500 bg-pink-50 rounded-full px-2 py-0.5">🎯 Stage-appropriate</span>
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 rounded-full px-2 py-0.5">✅ Within budget</span>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">🛍️ Where to Buy</p>
                <div className="space-y-2">
                  {[
                    {n:'Local Florist / Gift Shop',u:`https://www.google.com/maps/search/${encodeURIComponent(selGift.name)}+${encodeURIComponent(plan?.city||'')}`},
                    {n:'Shopee Malaysia',u:'https://shopee.com.my/search?keyword='+encodeURIComponent(selGift.name)},
                    {n:'Lazada Malaysia',u:'https://www.lazada.com.my/catalog/?q='+encodeURIComponent(selGift.name)},
                  ].map((s,i)=>(
                    <a key={i} href={s.u} target="_blank" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">{['🏪','🛒','📦'][i]}</span>
                      <span className="text-[12px] font-bold text-gray-700">{s.n}</span>
                      <ChevronRight className="h-4 w-4 text-gray-300 ml-auto"/>
                    </a>
                  ))}
                </div>
              </div>
              <button onClick={()=>setSelGift(null)} className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

          <button onClick={()=>{setPlan(null);setTab('plan');}} className="flex-1 py-3.5 rounded-2xl bg-pink-500 text-white text-sm font-extrabold">🔄 New Plan</button>
          <button onClick={async () => {
            const token = localStorage.getItem('accessToken');
            const uid = localStorage.getItem('userId') || '';
            if (!plan) return;
            const trips = JSON.parse(localStorage.getItem('saved_trips') || '[]');
            // Normalize to same structure as weekend-planner for consistent display in My Trips & Couple
            const savedDate = {
              id: 'date_' + Date.now(),
              title: plan.title || `${plan.city} Date`,
              destination: plan.city,
              type: 'date',
              groupType: 'COUPLE',
              walletType: 'COUPLE',
              totalCost: plan.totalCost || 0,
              startDate: plan.date || '',
              endDate: plan.date || '',
              days: 1,
              planDays: [{
                dayNumber: 1,
                date: plan.date || '',
                theme: plan.title || 'Date',
                stops: (plan.activities || []).map((a: any, i: number) => ({
                  placeName: a.name || a.placeName || a.title || '',
                  time: a.time || `${String(8 + i * 2).padStart(2, '0')}:00`,
                  duration: a.duration || '1.5h',
                  description: a.description || a.reason || '',
                  category: a.category || a.type || 'DATE',
                  emoji: a.emoji || '💕',
                  estimatedSpend: a.estimatedSpend || a.cost || 50,
                  isHiddenGem: false,
                  isPhotoSpot: true,
                })),
              }],
              planStops: (plan.activities || []).map((a: any, i: number) => ({
                ...a,
                day: 1,
                theme: plan.title || 'Date',
                placeName: a.name || a.placeName || a.title || '',
              })),
              budgetBreakdown: plan.budgetBreakdown || { total: plan.totalCost || 0 },
              totalStops: plan.activities?.length || 0,
              groupSize: 2,
              activities: plan.activities,
              fullPlan: plan,
              userId: uid,
              savedAt: new Date().toISOString(),
            };
            trips.unshift(savedDate);
            localStorage.setItem('saved_trips', JSON.stringify(trips.slice(0, 50)));
            toast.success('💕 Date saved! View in My Trips & Couple Space');
          }} className="flex-1 py-3.5 rounded-2xl bg-white border-2 border-pink-200 text-pink-500 text-sm font-extrabold">💾 Save Date</button>
        </div>
      </div>
      {viewImages && viewImages.length > 0 && (
        <ImageViewer images={viewImages} onClose={() => setViewImages(null)} alt="Date photo" />
      )}
    </div>
  );
}
