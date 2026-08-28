// Prefissi telefonici internazionali, in ordine numerico crescente. L'Italia
// (+39) resta il valore preselezionato nel form indipendentemente dalla sua
// posizione in elenco — vedi il `selected` in LeadFormBody.astro.
export interface Prefisso {
  flag: string;
  dial: string;
}

const prefissi: Prefisso[] = [
  { flag: '🇮🇹', dial: '+39'  }, // Italia
  { flag: '🇦🇫', dial: '+93'  }, // Afghanistan
  { flag: '🇦🇱', dial: '+355' }, // Albania
  { flag: '🇩🇿', dial: '+213' }, // Algeria
  { flag: '🇦🇩', dial: '+376' }, // Andorra
  { flag: '🇦🇴', dial: '+244' }, // Angola
  { flag: '🇦🇷', dial: '+54'  }, // Argentina
  { flag: '🇦🇲', dial: '+374' }, // Armenia
  { flag: '🇦🇺', dial: '+61'  }, // Australia
  { flag: '🇦🇹', dial: '+43'  }, // Austria
  { flag: '🇦🇿', dial: '+994' }, // Azerbaijan
  { flag: '🇧🇭', dial: '+973' }, // Bahrain
  { flag: '🇧🇩', dial: '+880' }, // Bangladesh
  { flag: '🇧🇾', dial: '+375' }, // Belarus
  { flag: '🇧🇪', dial: '+32'  }, // Belgio
  { flag: '🇧🇿', dial: '+501' }, // Belize
  { flag: '🇧🇯', dial: '+229' }, // Benin
  { flag: '🇧🇴', dial: '+591' }, // Bolivia
  { flag: '🇧🇦', dial: '+387' }, // Bosnia ed Erzegovina
  { flag: '🇧🇼', dial: '+267' }, // Botswana
  { flag: '🇧🇷', dial: '+55'  }, // Brasile
  { flag: '🇧🇳', dial: '+673' }, // Brunei
  { flag: '🇧🇬', dial: '+359' }, // Bulgaria
  { flag: '🇧🇫', dial: '+226' }, // Burkina Faso
  { flag: '🇧🇮', dial: '+257' }, // Burundi
  { flag: '🇰🇭', dial: '+855' }, // Cambogia
  { flag: '🇨🇲', dial: '+237' }, // Camerun
  { flag: '🇨🇦', dial: '+1'   }, // Canada
  { flag: '🇨🇻', dial: '+238' }, // Capo Verde
  { flag: '🇹🇩', dial: '+235' }, // Ciad
  { flag: '🇨🇱', dial: '+56'  }, // Cile
  { flag: '🇨🇳', dial: '+86'  }, // Cina
  { flag: '🇨🇾', dial: '+357' }, // Cipro
  { flag: '🇨🇴', dial: '+57'  }, // Colombia
  { flag: '🇰🇲', dial: '+269' }, // Comore
  { flag: '🇨🇬', dial: '+242' }, // Congo
  { flag: '🇨🇩', dial: '+243' }, // Congo (RD)
  { flag: '🇰🇷', dial: '+82'  }, // Corea del Sud
  { flag: '🇨🇷', dial: '+506' }, // Costa Rica
  { flag: '🇨🇮', dial: '+225' }, // Costa d'Avorio
  { flag: '🇭🇷', dial: '+385' }, // Croazia
  { flag: '🇨🇺', dial: '+53'  }, // Cuba
  { flag: '🇩🇰', dial: '+45'  }, // Danimarca
  { flag: '🇩🇯', dial: '+253' }, // Gibuti
  { flag: '🇪🇨', dial: '+593' }, // Ecuador
  { flag: '🇪🇬', dial: '+20'  }, // Egitto
  { flag: '🇸🇻', dial: '+503' }, // El Salvador
  { flag: '🇦🇪', dial: '+971' }, // Emirati Arabi Uniti
  { flag: '🇪🇷', dial: '+291' }, // Eritrea
  { flag: '🇪🇪', dial: '+372' }, // Estonia
  { flag: '🇪🇹', dial: '+251' }, // Etiopia
  { flag: '🇫🇯', dial: '+679' }, // Fiji
  { flag: '🇵🇭', dial: '+63'  }, // Filippine
  { flag: '🇫🇮', dial: '+358' }, // Finlandia
  { flag: '🇫🇷', dial: '+33'  }, // Francia
  { flag: '🇬🇦', dial: '+241' }, // Gabon
  { flag: '🇬🇲', dial: '+220' }, // Gambia
  { flag: '🇬🇪', dial: '+995' }, // Georgia
  { flag: '🇩🇪', dial: '+49'  }, // Germania
  { flag: '🇬🇭', dial: '+233' }, // Ghana
  { flag: '🇯🇲', dial: '+1876'}, // Giamaica
  { flag: '🇯🇵', dial: '+81'  }, // Giappone
  { flag: '🇯🇴', dial: '+962' }, // Giordania
  { flag: '🇬🇷', dial: '+30'  }, // Grecia
  { flag: '🇬🇩', dial: '+1473'}, // Grenada
  { flag: '🇬🇹', dial: '+502' }, // Guatemala
  { flag: '🇬🇳', dial: '+224' }, // Guinea
  { flag: '🇬🇼', dial: '+245' }, // Guinea-Bissau
  { flag: '🇬🇶', dial: '+240' }, // Guinea Equatoriale
  { flag: '🇬🇾', dial: '+592' }, // Guyana
  { flag: '🇭🇹', dial: '+509' }, // Haiti
  { flag: '🇭🇳', dial: '+504' }, // Honduras
  { flag: '🇭🇰', dial: '+852' }, // Hong Kong
  { flag: '🇮🇳', dial: '+91'  }, // India
  { flag: '🇮🇩', dial: '+62'  }, // Indonesia
  { flag: '🇮🇷', dial: '+98'  }, // Iran
  { flag: '🇮🇶', dial: '+964' }, // Iraq
  { flag: '🇮🇪', dial: '+353' }, // Irlanda
  { flag: '🇮🇸', dial: '+354' }, // Islanda
  { flag: '🇮🇱', dial: '+972' }, // Israele
  { flag: '🇰🇿', dial: '+7'   }, // Kazakistan
  { flag: '🇰🇪', dial: '+254' }, // Kenya
  { flag: '🇰🇬', dial: '+996' }, // Kirghizistan
  { flag: '🇽🇰', dial: '+383' }, // Kosovo
  { flag: '🇰🇼', dial: '+965' }, // Kuwait
  { flag: '🇱🇦', dial: '+856' }, // Laos
  { flag: '🇱🇸', dial: '+266' }, // Lesotho
  { flag: '🇱🇻', dial: '+371' }, // Lettonia
  { flag: '🇱🇧', dial: '+961' }, // Libano
  { flag: '🇱🇷', dial: '+231' }, // Liberia
  { flag: '🇱🇾', dial: '+218' }, // Libia
  { flag: '🇱🇮', dial: '+423' }, // Liechtenstein
  { flag: '🇱🇹', dial: '+370' }, // Lituania
  { flag: '🇱🇺', dial: '+352' }, // Lussemburgo
  { flag: '🇲🇴', dial: '+853' }, // Macao
  { flag: '🇲🇰', dial: '+389' }, // Macedonia del Nord
  { flag: '🇲🇬', dial: '+261' }, // Madagascar
  { flag: '🇲🇼', dial: '+265' }, // Malawi
  { flag: '🇲🇾', dial: '+60'  }, // Malaysia
  { flag: '🇲🇻', dial: '+960' }, // Maldive
  { flag: '🇲🇱', dial: '+223' }, // Mali
  { flag: '🇲🇹', dial: '+356' }, // Malta
  { flag: '🇲🇦', dial: '+212' }, // Marocco
  { flag: '🇲🇷', dial: '+222' }, // Mauritania
  { flag: '🇲🇺', dial: '+230' }, // Mauritius
  { flag: '🇲🇽', dial: '+52'  }, // Messico
  { flag: '🇲🇩', dial: '+373' }, // Moldova
  { flag: '🇲🇨', dial: '+377' }, // Monaco
  { flag: '🇲🇳', dial: '+976' }, // Mongolia
  { flag: '🇲🇪', dial: '+382' }, // Montenegro
  { flag: '🇲🇿', dial: '+258' }, // Mozambico
  { flag: '🇲🇲', dial: '+95'  }, // Myanmar
  { flag: '🇳🇦', dial: '+264' }, // Namibia
  { flag: '🇳🇵', dial: '+977' }, // Nepal
  { flag: '🇳🇮', dial: '+505' }, // Nicaragua
  { flag: '🇳🇪', dial: '+227' }, // Niger
  { flag: '🇳🇬', dial: '+234' }, // Nigeria
  { flag: '🇳🇴', dial: '+47'  }, // Norvegia
  { flag: '🇳🇿', dial: '+64'  }, // Nuova Zelanda
  { flag: '🇴🇲', dial: '+968' }, // Oman
  { flag: '🇳🇱', dial: '+31'  }, // Paesi Bassi
  { flag: '🇵🇰', dial: '+92'  }, // Pakistan
  { flag: '🇵🇼', dial: '+680' }, // Palau
  { flag: '🇵🇸', dial: '+970' }, // Palestina
  { flag: '🇵🇦', dial: '+507' }, // Panama
  { flag: '🇵🇬', dial: '+675' }, // Papua Nuova Guinea
  { flag: '🇵🇾', dial: '+595' }, // Paraguay
  { flag: '🇵🇪', dial: '+51'  }, // Perù
  { flag: '🇵🇱', dial: '+48'  }, // Polonia
  { flag: '🇵🇹', dial: '+351' }, // Portogallo
  { flag: '🇶🇦', dial: '+974' }, // Qatar
  { flag: '🇬🇧', dial: '+44'  }, // Regno Unito
  { flag: '🇨🇿', dial: '+420' }, // Repubblica Ceca
  { flag: '🇩🇴', dial: '+1809'}, // Repubblica Dominicana
  { flag: '🇷🇴', dial: '+40'  }, // Romania
  { flag: '🇷🇼', dial: '+250' }, // Ruanda
  { flag: '🇷🇺', dial: '+7'   }, // Russia
  { flag: '🇸🇲', dial: '+378' }, // San Marino
  { flag: '🇸🇦', dial: '+966' }, // Arabia Saudita
  { flag: '🇸🇳', dial: '+221' }, // Senegal
  { flag: '🇷🇸', dial: '+381' }, // Serbia
  { flag: '🇸🇨', dial: '+248' }, // Seychelles
  { flag: '🇸🇱', dial: '+232' }, // Sierra Leone
  { flag: '🇸🇬', dial: '+65'  }, // Singapore
  { flag: '🇸🇾', dial: '+963' }, // Siria
  { flag: '🇸🇰', dial: '+421' }, // Slovacchia
  { flag: '🇸🇮', dial: '+386' }, // Slovenia
  { flag: '🇸🇴', dial: '+252' }, // Somalia
  { flag: '🇪🇸', dial: '+34'  }, // Spagna
  { flag: '🇱🇰', dial: '+94'  }, // Sri Lanka
  { flag: '🇺🇸', dial: '+1'   }, // Stati Uniti
  { flag: '🇿🇦', dial: '+27'  }, // Sudafrica
  { flag: '🇸🇩', dial: '+249' }, // Sudan
  { flag: '🇸🇸', dial: '+211' }, // Sud Sudan
  { flag: '🇸🇪', dial: '+46'  }, // Svezia
  { flag: '🇨🇭', dial: '+41'  }, // Svizzera
  { flag: '🇸🇿', dial: '+268' }, // Eswatini
  { flag: '🇹🇼', dial: '+886' }, // Taiwan
  { flag: '🇹🇯', dial: '+992' }, // Tagikistan
  { flag: '🇹🇿', dial: '+255' }, // Tanzania
  { flag: '🇹🇭', dial: '+66'  }, // Thailandia
  { flag: '🇹🇬', dial: '+228' }, // Togo
  { flag: '🇹🇴', dial: '+676' }, // Tonga
  { flag: '🇹🇹', dial: '+1868'}, // Trinidad e Tobago
  { flag: '🇹🇳', dial: '+216' }, // Tunisia
  { flag: '🇹🇷', dial: '+90'  }, // Turchia
  { flag: '🇹🇲', dial: '+993' }, // Turkmenistan
  { flag: '🇺🇦', dial: '+380' }, // Ucraina
  { flag: '🇺🇬', dial: '+256' }, // Uganda
  { flag: '🇭🇺', dial: '+36'  }, // Ungheria
  { flag: '🇺🇾', dial: '+598' }, // Uruguay
  { flag: '🇺🇿', dial: '+998' }, // Uzbekistan
  { flag: '🇻🇺', dial: '+678' }, // Vanuatu
  { flag: '🇻🇪', dial: '+58'  }, // Venezuela
  { flag: '🇻🇳', dial: '+84'  }, // Vietnam
  { flag: '🇾🇪', dial: '+967' }, // Yemen
  { flag: '🇿🇲', dial: '+260' }, // Zambia
  { flag: '🇿🇼', dial: '+263' }, // Zimbabwe
];

// Ordine progressivo per prefisso (numerico crescente). L'Italia resta selezionata di default.
prefissi.sort((a, b) => parseInt(a.dial.slice(1), 10) - parseInt(b.dial.slice(1), 10));

export default prefissi;
