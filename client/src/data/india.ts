export const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Jammu and Kashmir','Ladakh','Puducherry'];

export const DISTRICTS_BY_STATE: Record<string,string[]> = {
  'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Erode','Vellore','Thoothukudi','Dindigul','Thanjavur','Namakkal','Karur','Dharmapuri','Krishnagiri','Kanyakumari','Nagapattinam','Perambalur','Ariyalur','Villupuram','Cuddalore','Pudukkottai','Ramanathapuram','The Nilgiris','Theni','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Chengalpattu','Tenkasi','Tirupattur','Kallakurichi','Mayiladuthurai','Ranipet','Sivaganga','Virudhunagar'],
  'Maharashtra': ['Mumbai','Pune','Nagpur','Thane','Nashik','Aurangabad','Solapur','Kolhapur','Amravati','Nanded','Sangli','Satara','Raigad','Osmanabad','Parbhani','Jalgaon','Akola','Latur','Dhule','Jalna','Ratnagiri','Wardha','Yavatmal','Buldhana','Chandrapur'],
  'Karnataka': ['Bangalore','Mysore','Hubli','Mangalore','Belgaum','Gulbarga','Davanagere','Bellary','Bijapur','Shimoga','Tumkur','Raichur','Bidar','Hassan','Udupi','Chitradurga','Kolar','Mandya','Chikmagalur','Bagalkot','Dharwad','Haveri','Koppal','Gadag','Chamarajanagar','Yadgir','Vijayapura','Kodagu','Chikkaballapur','Ramanagara'],
  'Kerala': ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad','Alappuzha','Kannur','Kottayam','Malappuram','Kasaragod','Pathanamthitta','Idukki','Wayanad'],
  'Andhra Pradesh': ['Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Rajahmundry','Tirupati','Kakinada','Kadapa','Anantapur','Eluru','Ongole','Vizianagaram','Srikakulam','Chittoor'],
  'Telangana': ['Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam','Mahbubnagar','Nalgonda','Adilabad','Suryapet','Siddipet','Sangareddy','Medchal','Rangareddy'],
  'Uttar Pradesh': ['Lucknow','Kanpur','Agra','Varanasi','Meerut','Allahabad','Ghaziabad','Bareilly','Aligarh','Moradabad','Saharanpur','Gorakhpur','Noida','Mathura','Rampur'],
  'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Junagadh','Gandhinagar','Anand','Mehsana','Bharuch','Navsari','Valsad','Kutch','Patan'],
  'Rajasthan': ['Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bhilwara','Alwar','Sikar','Sri Ganganagar','Bharatpur','Pali','Tonk','Dausa','Chittorgarh'],
  'West Bengal': ['Kolkata','Howrah','Durgapur','Asansol','Siliguri','Bardhaman','Malda','Murshidabad','Jalpaiguri','Bankura','Birbhum','Purulia','Nadia','North 24 Parganas','South 24 Parganas'],
  'Delhi': ['New Delhi','North Delhi','South Delhi','East Delhi','West Delhi','Central Delhi','North West Delhi','South West Delhi','North East Delhi','Shahdara'],
  'Punjab': ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Pathankot','Hoshiarpur','Mohali','Moga','Firozpur','Gurdaspur','Kapurthala','Faridkot'],
  'Haryana': ['Faridabad','Gurgaon','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal','Sonipat','Panchkula','Bhiwani','Sirsa','Jind'],
  'Bihar': ['Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Bihar Sharif','Arrah','Begusarai','Katihar','Munger','Chhapra'],
  'Madhya Pradesh': ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna','Ratlam','Rewa','Singrauli','Burhanpur','Khandwa','Chhindwara'],
};

export const getDistricts = (state: string): string[] =>
  DISTRICTS_BY_STATE[state] || [];
