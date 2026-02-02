
import { UtFaaliyetTuru, UtVergiTuru, UtIndirimSecimi, CityGroups } from './constants';

// --- Constants from C# Code ---
const FaaliyetTuruZamIndirimOranlari = {
    [UtFaaliyetTuru.SanayiIsletmesi]: 20,
    [UtFaaliyetTuru.AkaryakitTupgazTekelBayii]: -50,
    [UtFaaliyetTuru.InsaatTaahut]: 20,
    [UtFaaliyetTuru.EczaDeposu]: -50,
    [UtFaaliyetTuru.TicaretHizmet]: 0,
    [UtFaaliyetTuru.DovizAlimSatim]: -80,
    [UtFaaliyetTuru.GayriFaal]: -50,
    [UtFaaliyetTuru.Diger]: -50
};

const SmmmIndirimOrani = 20;
const GrupSirketleriIndirimOrani = 35;

const GelirVergisiTasdikDilimleri = [
    [143103449, 0.00200],
    [143103449, 0.00175],
    [214655173, 0.00125],
    [214655173, 0.000750],
    [572413795, 0.000375],
    [3005172426, 0.000020],
    [4293103466, 0.00000150]
];

const KurumlarVergisiTasdikDilimleri = [
    [143103449, 0.00200],
    [143103449, 0.00175],
    [214655173, 0.00125],
    [214655173, 0.000750],
    [572413795, 0.000375],
    [3005172426, 0.000020],
    [4293103466, 0.00000150]
];

const GelirVergisiAsgariBazTutar = 168878;
const KurumlarVergisiAsgariBazTutar = 186036;
const SanayiVeInsaatAsgariTutarKatsayi = 1.2; // %20 fazla
const GayriFaalAsgariTutarKatsayi = 0.5; // %50 indirim


// --- Helper Functions ---

function getRegionalDiscountRate(cityCode) {
    const c = parseInt(cityCode);
    if (CityGroups.G1.includes(c)) return 10;
    if (CityGroups.G2.includes(c)) return 15;
    if (CityGroups.G3.includes(c)) return 20;
    if (CityGroups.G4.includes(c)) return 25;
    return 0;
}

function calculateBaseAmount(tranche, taxableAmount) {
    let result = 0;
    let remaining = taxableAmount;

    for (let i = 0; i < tranche.length; i++) {
        const threshold = tranche[i][0];
        const rate = tranche[i][1];

        const deductable = Math.min(remaining, threshold);
        const deduction = deductable * rate;

        result += deduction;
        remaining -= deductable;

        if (remaining <= 0) break;
    }
    return result;
}

function calculateMinimumFee(faaliyetTuru, vergiTuru, cityCode) {
    let amount = (parseInt(vergiTuru) === UtVergiTuru.GelirVergisi)
        ? GelirVergisiAsgariBazTutar
        : KurumlarVergisiAsgariBazTutar;

    const ft = parseInt(faaliyetTuru);
    if (ft === UtFaaliyetTuru.SanayiIsletmesi || ft === UtFaaliyetTuru.InsaatTaahut) {
        amount = amount * SanayiVeInsaatAsgariTutarKatsayi;
    } else if (ft === UtFaaliyetTuru.GayriFaal) {
        amount = amount * GayriFaalAsgariTutarKatsayi;
    }

    const cityDiscount = getRegionalDiscountRate(cityCode);
    amount = amount * (100 - cityDiscount) / 100;

    return amount;
}

// --- Main Calculation Function ---
// Returns object with calculated fields
export function calculateContractFee(data) {
    try {
        // Validate required fields
        const required = ['UtFaaliyetTuru', 'UtVergiTuru', 'UtIlKodu', 'UtOncekiYilNetSatis'];
        for (const field of required) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                return { success: false, error: `${field} eksik.` };
            }
        }

        const faaliyetTuru = parseInt(data.UtFaaliyetTuru);
        const vergiTuru = parseInt(data.UtVergiTuru);
        const cityCode = parseInt(data.UtIlKodu);
        const oncekiYilSatis = parseFloat(data.UtOncekiYilNetSatis) || 0;
        const indirimSecimi = parseInt(data.UtIndirimSecimi) || 0;
        const digerIndirimler = parseFloat(data.UtDigerIndirimler) || 0;

        // 1. Sector Discount/Surge on Previous Year Sales
        const rate = FaaliyetTuruZamIndirimOranlari[faaliyetTuru] || 0;
        // The C# logic says: sektorIndirimi = oncekiYilSatis * -rate / 100;
        // If rate is +20 (Surge), result is negative (Logic in C# seems to subtract 'sektorIndirimi')
        // Let's trace C# closely:
        // decimal sektorIndirimi = oncekiYilSatis * -_faaliyetTuruZamIndirimOranlari[faaliyetTuru] / 100m;
        // decimal matrah = oncekiYilSatis - sektorIndirimi;
        // If rate is 20: sektorIndirimi = Satis * -0.2. Matrah = Satis - (-0.2*Satis) = 1.2 * Satis. Correct.
        // If rate is -50: sektorIndirimi = Satis * 0.5. Matrah = Satis - (0.5*Satis) = 0.5 * Satis. Correct.

        let sektorIndirimi = oncekiYilSatis * (-rate) / 100;
        if (sektorIndirimi < 0 && rate > 0) {
            // Logic check: if rate is positive (zam), sektorIndirimi is negative number.
            // C# says "if (sektorIndirimi < 0) sektorIndirimi = 0". Wait.
            // C#: if (sektorIndirimi < 0) sektorIndirimi = 0;
            // This means if it's a SURGE (rate > 0), sektorIndirimi becomes 0?
            // Then Matrah = Satis - 0 = Satis.
            // AND THEN later: decimal faaliyetTuruZammi = hesaplananUcret * _faaliyetTuruZamIndirimOranlari...
            // So the surge is applied LATER on the fee, not the base?
            // BUT for DISCOUNT (rate < 0), sektorIndirimi is positive. Matrah = Satis - Indirim.
            // Let's check C# logic again.

            /* C# Code:
             decimal sektorIndirimi = oncekiYilSatis * -rate / 100m;
             if (sektorIndirimi < 0) sektorIndirimi = 0;
             decimal matrah = oncekiYilSatis - sektorIndirimi;
            */
            // If rate is +20: sektorIndirimi = Sales * -0.2 (Negative). -> Caps to 0. Matrah = Sales.
            // If rate is -50: sektorIndirimi = Sales * 0.5 (Positive). -> Matrah = Sales * 0.5.

            // So: Discounts reduce the base (Matrah). Surges do NOT increase the base, they apply to the FEE.
        }

        // JS Logic matching C#:
        let rawSektorIndirimi = oncekiYilSatis * (-rate) / 100;
        if (rawSektorIndirimi < 0) rawSektorIndirimi = 0;

        const matrah = oncekiYilSatis - rawSektorIndirimi;

        // 2. Base Fee Calculation from Tranches
        const tranches = (vergiTuru === UtVergiTuru.GelirVergisi)
            ? GelirVergisiTasdikDilimleri
            : KurumlarVergisiTasdikDilimleri;

        const indirimeEsasUcret = calculateBaseAmount(tranches, matrah);

        // 3. Regional Discount (Yöre İndirimi)
        const cityDiscountRate = getRegionalDiscountRate(cityCode);
        const yoreIndirimi = indirimeEsasUcret * cityDiscountRate / 100;

        const hesaplananUcret = indirimeEsasUcret - yoreIndirimi;

        // 4. Activity Type Surge (Faaliyet Türü Zammı)
        // C#: decimal faaliyetTuruZammi = hesaplananUcret * rate / 100;
        // if (faaliyetTuruZammi < 0) faaliyetTuruZammi = 0;
        let faaliyetTuruZammi = hesaplananUcret * rate / 100;
        if (faaliyetTuruZammi < 0) faaliyetTuruZammi = 0;
        // Note: Discounts were applied to BASE. Surges are applied to FEE. Correct.

        // 5. Special Discounts (SMMM / Group)
        let smmmIndirimi = 0;
        let grupIndirimi = 0;

        const subTotal = hesaplananUcret + faaliyetTuruZammi;

        if (indirimSecimi === UtIndirimSecimi.SMMM) {
            smmmIndirimi = subTotal * SmmmIndirimOrani / 100;
        } else if (indirimSecimi === UtIndirimSecimi.GrupSirketleri) {
            grupIndirimi = subTotal * GrupSirketleriIndirimOrani / 100;
        }

        // 6. Final Calculation
        let finalFee = subTotal - smmmIndirimi - grupIndirimi - digerIndirimler;

        // 7. Minimum Fee Check
        const minimumFee = calculateMinimumFee(faaliyetTuru, vergiTuru, cityCode);

        const kararlastirilanUcret = Math.max(finalFee, minimumFee);

        return {
            success: true,
            UtSektorIndirimi: rawSektorIndirimi,
            UtMatrah: matrah,
            UtIndirimeEsasUcret: indirimeEsasUcret,
            UtYoreIndirimi: yoreIndirimi,
            UtHesaplananUcret: hesaplananUcret,
            UtFaaliyetTuruZammi: faaliyetTuruZammi,
            UtSmVeyaSmmmIndirimi: smmmIndirimi,
            UtGrupSirketleriIndirimi: grupIndirimi,
            UtKararlastirilanUcret: kararlastirilanUcret,
            UtSozlesmeHesaplamaDurumu: `Hesaplama yapıldı. Kararlaştırılan Ücret: ${kararlastirilanUcret.toFixed(2)} TL`
        };

    } catch (e) {
        return { success: false, error: e.message };
    }
}
