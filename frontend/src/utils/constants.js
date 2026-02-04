
export const UtFaaliyetTuru = {
    SanayiIsletmesi: 0,
    AkaryakitTupgazTekelBayii: 1,
    InsaatTaahut: 2,
    EczaDeposu: 3,
    TicaretHizmet: 4,
    DovizAlimSatim: 5,
    GayriFaal: 6,
    Diger: 99
};

export const UtFaaliyetTuruLabel = {
    [UtFaaliyetTuru.SanayiIsletmesi]: "Sanayi İşletmesi",
    [UtFaaliyetTuru.AkaryakitTupgazTekelBayii]: "Akaryakıt / Tüpgaz / Tekel Bayii / Demir, Çelik",
    [UtFaaliyetTuru.InsaatTaahut]: "İnşaat Taahhüt",
    [UtFaaliyetTuru.EczaDeposu]: "Ecza Deposu",
    [UtFaaliyetTuru.TicaretHizmet]: "Ticaret ve Hizmet",
    [UtFaaliyetTuru.DovizAlimSatim]: "Döviz Alım Satım / Motorlu Taşıt Ticareti , Hazır Kart Dağıtımı",
    [UtFaaliyetTuru.GayriFaal]: "Gayri Faal",
    [UtFaaliyetTuru.Diger]: "Diğer"
};

export const UtIndirimSecimi = {
    Yok: 0,
    SMMM: 2,
    GrupSirketleri: 3
};

export const UtIndirimSecimiLabel = {
    [UtIndirimSecimi.Yok]: "İndirim Yok",
    [UtIndirimSecimi.SMMM]: "SMMM İndirimi (%20)",
    [UtIndirimSecimi.GrupSirketleri]: "Grup Şirketleri İndirimi (%35)"
};

export const UtVergiTuru = {
    GelirVergisi: 0,
    KurumlarVergisi: 1
};

export const UtVergiTuruLabel = {
    [UtVergiTuru.GelirVergisi]: "Gelir Vergisi",
    [UtVergiTuru.KurumlarVergisi]: "Kurumlar Vergisi"
};

// City Groups for Region Discount - Synced with SozlesmeUcretTespit.cs
export const CityGroups = {
    // Group 1 (%10 Discount): Adana(1), Antalya(7), Balıkesir(10), Bursa(16), Denizli(20), Eskişehir(26), 
    // Gaziantep(27), Mersin(33), Kayseri(38), Kocaeli(41), Konya(42), Muğla(48), Sakarya(54), Samsun(55), Tekirdağ(59)
    G1: [1, 7, 10, 16, 20, 26, 27, 33, 38, 41, 42, 48, 54, 55, 59],

    // Group 2 (%15 Discount): Aydın(9), Bolu(14), Çanakkale(17), Diyarbakır(21), Edirne(22), Hatay(31), 
    // KMaraş(46), Kırklareli(39), Kütahya(43), Malatya(44), Manisa(45), Trabzon(61), Zonguldak(67), 
    // Kırıkkale(71), Bartın(74), Karabük(78), Yalova(77), Düzce(81), Osmaniye(80), Çorum(19), Şanlıurfa(63)
    G2: [9, 14, 17, 21, 22, 31, 46, 39, 43, 44, 45, 61, 67, 71, 74, 78, 77, 81, 80, 19, 63],

    // Group 3 (%20 Discount): Adıyaman(2), Afyon(3), Ağrı(4), Amasya(5), Artvin(8), Batman(72), Bilecik(11), 
    // Burdur(15), Çankırı(18), Elazığ(23), Erzincan(24), Erzurum(25), Giresun(28), Isparta(32), Nevşehir(50), 
    // Van(65), Kars(36), Kastamonu(37), Kırşehir(40), Kilis(79), Niğde(51), Ordu(52), Rize(53), Sinop(57), 
    // Sivas(58), Tokat(60), Uşak(64), Yozgat(66), Aksaray(68), Karaman(70)
    G3: [2, 3, 4, 5, 8, 72, 11, 15, 18, 23, 24, 25, 28, 32, 50, 65, 36, 37, 40, 79, 51, 52, 53, 57, 58, 60, 64, 66, 68, 70],

    // Group 4 (%25 Discount): Ardahan(75), Iğdır(76), Bingöl(12), Bitlis(13), Gümüşhane(29), Hakkari(30), 
    // Mardin(47), Muş(49), Siirt(56), Tunceli(62), Bayburt(69), Şırnak(73)
    G4: [75, 76, 12, 13, 29, 30, 47, 49, 56, 62, 69, 73]
};

// All Cities list for Dropdown (Simplified list for now, ideally complete list)
export const Cities = [
    { code: 35, name: 'İzmir' },
    { code: 9, name: 'Aydın' },
    { code: 17, name: 'Çanakkale' },
    { code: 20, name: 'Denizli' },
    { code: 45, name: 'Manisa' },
    { code: 48, name: 'Muğla' },
    { code: 64, name: 'Uşak' },
    { code: 1, name: 'Adana' },
    { code: 2, name: 'Adıyaman' },
    { code: 3, name: 'Afyonkarahisar' },
    { code: 4, name: 'Ağrı' },
    { code: 68, name: 'Aksaray' },
    { code: 5, name: 'Amasya' },
    { code: 6, name: 'Ankara' },
    { code: 7, name: 'Antalya' },
    { code: 75, name: 'Ardahan' },
    { code: 8, name: 'Artvin' },
    { code: 10, name: 'Balıkesir' },
    { code: 74, name: 'Bartın' },
    { code: 72, name: 'Batman' },
    { code: 69, name: 'Bayburt' },
    { code: 11, name: 'Bilecik' },
    { code: 12, name: 'Bingöl' },
    { code: 13, name: 'Bitlis' },
    { code: 14, name: 'Bolu' },
    { code: 15, name: 'Burdur' },
    { code: 16, name: 'Bursa' },
    { code: 18, name: 'Çankırı' },
    { code: 19, name: 'Çorum' },
    { code: 21, name: 'Diyarbakır' },
    { code: 81, name: 'Düzce' },
    { code: 22, name: 'Edirne' },
    { code: 23, name: 'Elazığ' },
    { code: 24, name: 'Erzincan' },
    { code: 25, name: 'Erzurum' },
    { code: 26, name: 'Eskişehir' },
    { code: 27, name: 'Gaziantep' },
    { code: 28, name: 'Giresun' },
    { code: 29, name: 'Gümüşhane' },
    { code: 30, name: 'Hakkari' },
    { code: 31, name: 'Hatay' },
    { code: 76, name: 'Iğdır' },
    { code: 32, name: 'Isparta' },
    { code: 34, name: 'İstanbul' },
    { code: 46, name: 'Kahramanmaraş' },
    { code: 78, name: 'Karabük' },
    { code: 70, name: 'Karaman' },
    { code: 36, name: 'Kars' },
    { code: 37, name: 'Kastamonu' },
    { code: 38, name: 'Kayseri' },
    { code: 71, name: 'Kırıkkale' },
    { code: 39, name: 'Kırklareli' },
    { code: 40, name: 'Kırşehir' },
    { code: 79, name: 'Kilis' },
    { code: 41, name: 'Kocaeli' },
    { code: 42, name: 'Konya' },
    { code: 43, name: 'Kütahya' },
    { code: 44, name: 'Malatya' },
    { code: 47, name: 'Mardin' },
    { code: 33, name: 'Mersin' },
    { code: 49, name: 'Muş' },
    { code: 50, name: 'Nevşehir' },
    { code: 51, name: 'Niğde' },
    { code: 52, name: 'Ordu' },
    { code: 80, name: 'Osmaniye' },
    {
        code: 53,
        name: 'Rize'
    },
    { code: 54, name: 'Sakarya' },
    { code: 55, name: 'Samsun' },
    { code: 56, name: 'Siirt' },
    { code: 57, name: 'Sinop' },
    { code: 58, name: 'Sivas' },
    { code: 63, name: 'Şanlıurfa' },
    { code: 73, name: 'Şırnak' },
    { code: 59, name: 'Tekirdağ' },
    { code: 60, name: 'Tokat' },
    { code: 61, name: 'Trabzon' },
    { code: 62, name: 'Tunceli' },
    { code: 65, name: 'Van' },
    { code: 77, name: 'Yalova' },
    { code: 66, name: 'Yozgat' },
    { code: 67, name: 'Zonguldak' }
];

