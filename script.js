$(document).ready(function() {
  var optionA = $('div.optionA');
  var optionB = $('div.optionB');
  optionA.hide();
  optionB.hide();

  var propertyType = $('.propertyType');
  var landsize = $('.landsize');
  var metersize = $('.metersize');

  var radio = $('input[name=reading]');
  radio.on('click', showOptions);

  function showOptions(){
    if(radio.filter(':checked').val() === 'reading'){
      optionA.show();
      optionB.hide();
      $('.submit').on('click', readingCalc);
    } else{
      optionB.show();
      optionA.hide();
    }
  }


  var PRORATIONVALUE = 1.0;
  var FIREPROTECTIONCHARGE = 1.48;
  var waterConnectionCharge;
  var wasteWaterConnectionCharge;
  var stormDrainageCharge;
  var customerAssisFund;
  var totalInfraCharge;
  var currReading = $('#currReading');
  var lastReading = $('#lastReading');
  var consumption = 0;;
  var LDMwaterUsage = 0;
  var LDMwasteWaterUsage = 0;
  var waterUsage = 0;
  var wasteWaterUsage=0;
  var totalUsageCharge=0;

  function totalInfrastructureCharges(data) {
      waterConnectionCharge = data.WaterConnect[data.MeterSize.indexOf(metersize.val())];
      wasteWaterConnectionCharge = data.WasteWaterConnect[data.MeterSize.indexOf(metersize.val())];

      if(parseFloat(landsize.val()) > 0.4) {
        stormDrainageCharge = data.StormOver[data.RateClasses.indexOf(propertyType.val())] * parseFloat(landsize.val()) * PRORATIONVALUE;
      } else {
        stormDrainageCharge = data.StormUnder[data.RateClasses.indexOf(propertyType.val())] * PRORATIONVALUE;
      }

      if(propertyType.val() === 'RESIDENTIAL' || propertyType.val() === 'LDM') {
        customerAssisFund = 0.25;
      } else {
        customerAssisFund = 0
      }

      totalInfraCharge =
        waterConnectionCharge + wasteWaterConnectionCharge + stormDrainageCharge
        + customerAssisFund + FIREPROTECTIONCHARGE;
    }


  function usageCharges(data) {
    var tierRange = data.TierRange.reduce((prev, curr) => {
      return ((consumption > prev) && (consumption < curr) ? prev : curr);
    });
    var tierRangeIndex = data.TierRange.indexOf(tierRange);

    let i;
    let cost = 0;
    for(i = 0; i <= tierRangeIndex; i++){
      if(i == tierRangeIndex) {
        cost += (consumption - (data.TierRange[i]-1)) * data.Rate[i];
      } else{
        cost += (data.ProratedTier[i] * data.Rate[i]);
      }
    }
    if (data.TierRange[2] === 40 && data.Rate[1] === 2.0596) {//check if the file is WaterRatesAndTiersLDM
      LDMwaterUsage = cost.toFixed(2);
    } else if (data.TierRange[2] === 40 && data.Rate[1] === 1.8305){//check if the file is waterwasteRatesAndTiersLDM
      LDMwasteWaterUsage = cost.toFixed(2);
    } else if (data.TierRange[2] === 16 && data.Rate[1] === 2.0596) { //check if the file is WaterRatesAndTiers
      waterUsage = cost.toFixed(2);
    } else if (data.TierRange[2] === 16 && data.Rate[1] === 1.8305){
      wasteWaterUsage = cost.toFixed(2);
    }
  }

  function readingCalc(){
    //total infrastructure charges
    consumption = parseFloat(currReading.val()) - parseFloat(lastReading.val());
    $.get('data/list.json', totalInfrastructureCharges);
    console.log(totalInfraCharge);
    // total usage charges

    if(propertyType.val() === 'LDM') {
      $.get('data/WaterRatesAndTiersLDM.json', usageCharges);
      $.get('data/waterwasteRatesAndTiersLDM.json', usageCharges);
      totalUsageCharge = LDMwaterUsage + LDMwasteWaterUsage;
      // console.log(LDMwaterUsage);
    } else {
      $.get('data/WaterRatesAndTiers.json', usageCharges);
      $.get('data/waterwasteRatesAndTiers.json', usageCharges);
      totalUsageCharge = waterUsage + wasteWaterUsage;
    }
    $('div.result').html(totalUsageCharge);
  }

});
