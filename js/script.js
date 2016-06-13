$(document).ready(function() {
  var optionA = $('div.optionA');
  var optionB = $('div.optionB');
  var visual = $('div.visual');
  optionA.hide();
  optionB.hide();
  visual.hide();


  var radio = $('input[name=reading]');
  radio.on('click', showOptions);

  function showOptions(){
    if(radio.filter(':checked').val() === 'reading'){
      optionA.show();
      optionB.hide();
      $('.submit').on('click', {option: 'reading'}, calculate);
    } else{
      optionB.show();
      optionA.hide();
      $('.submit').on('click', {option: 'consumption'}, calculate);
    }
  }

///////////////////////////////////////DATA////////////////////////////////////////////////
//speadsheet -- Hidden list table
  var list = {
    "RateClasses":
      ["RESIDENTIAL","LDM","COMMERCIAL","INSTITUTIONAL","INDUSTRIAL"],
    "UNITS":
      [1,2,3,4,5,6,0,0,0,0],
    "YesNo":
      ["YES","NO"],
    "TIER":
      [7,8,10,10,215,6750,43000,50000,0,0],
    "MeterSize":
      ["16mm","19mm","25mm","40mm","50mm","76mm","100mm","150mm","200mm","250mm"],
    "WaterConnect":
      [14.46,21.69,36.15,72.31,115.7,253.06,433.83,1012.28,1735.21,2169.29],
    "WasteWaterConnect":
      [12.25,18.36,30.59,61.18,97.89,214.13,367.07,856.52,1468.32,1835.91],
    "StormUnder":
      [14.92,14.92,14.92,14.92,14.92,0,0,0,0,0],
    "StormOver":
      [124.19,124.19,124.19,124.19,124.19,0,0,0,0,0]
  };

//waterRatesAndTiers Table & wastewaterRatesAndTiers Table
  var rates = {
    "ProratedTier":[7,8,10,10,215,6750,43000,50000],
    "Consumption":[7,0,0,0,0,0,0,0],
    "TierRange":[0,8,16,26,36,251,7001,50001],
    "WaterRate":[0,2.0596,2.6481,2.9424,1.1182,1.0593,0.9652,0.8593],
    "WaterWasteRate": [0,1.8305,2.3536,2.6151,0.9936,0.9414,0.8578,0.7636]
  };
  var ratesLDM = {
    "ProratedTier":[7,32,40,40,860,27000,172000,200000],
    "Consumption":[7,0,0,0,0,0,0,0],
    "TierRange":[0,8,40,80,120,980,27980,199980],
    "WaterRate":[0,2.0596,2.6481,2.9424,1.1182,1.0593,0.9652,0.8593],
    "WaterWasteRate": [0,1.8305,2.3536,2.6151,0.9936,0.9414,0.8578,0.7636]
  }

///////////////////////////////////////////////////////////////////////////////////////

  var propertyType = $('.propertyType');
  var landsize = $('.landsize');
  var metersize = $('.metersize');
  var currReading = $('#currReading');
  var lastReading = $('#lastReading');
  var consumptionInput = $('#consumption');

  var PRORATIONVALUE = 1.0;
  var FIREPROTECTIONCHARGE = 1.48;
  var waterConnectionCharge;
  var wasteWaterConnectionCharge;
  var stormDrainageCharge;
  var customerAssisFund;
  var totalInfraCharge = 0;

  var consumption = 0;;
  var LDMwaterUsage = 0;
  var LDMwasteWaterUsage = 0;
  var waterUsage = 0;
  var wasteWaterUsage=0;
  var totalUsageCharge=0;
  var totalCharge = 0;

//calculate the total infrastructure charges
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
      (waterConnectionCharge + wasteWaterConnectionCharge + stormDrainageCharge
      + customerAssisFund + FIREPROTECTIONCHARGE);
    }

//calculate the total usage charges
  function usageCharges(data) {
    var tierRange = data.TierRange.reduce((prev, curr) => {
      return ((consumption >= prev) && (consumption < curr) ? prev : curr);
    });
    var tierRangeIndex = data.TierRange.indexOf(tierRange);

    var i;
    var waterCost = 0;
    var wasteWaterCost = 0;
    for(i = 0; i <= tierRangeIndex; i++){
      if(i == tierRangeIndex) {
        waterCost += (consumption - (data.TierRange[i]-1)) * data.WaterRate[i];
        wasteWaterCost += (consumption - (data.TierRange[i]-1)) * data.WaterWasteRate[i];
      } else{
        waterCost += (data.ProratedTier[i] * data.WaterRate[i]);
        wasteWaterCost += (data.ProratedTier[i] * data.WaterWasteRate[i]);
      }
    }

    if (data.TierRange[2] === 40 && data.WaterRate[1] === 2.0596) {//check if the file is WaterRatesAndTiersLDM
      LDMwaterUsage = waterCost.toFixed(2);
    }
    if (data.TierRange[2] === 40 && data.WaterWasteRate[1] === 1.8305){//check if the file is waterwasteRatesAndTiersLDM
      LDMwasteWaterUsage = wasteWaterCost.toFixed(2);
    }
    if (data.TierRange[2] === 16 && data.WaterRate[1] === 2.0596) { //check if the file is WaterRatesAndTiers
      waterUsage = waterCost.toFixed(2);
    }
    if (data.TierRange[2] === 16 && data.WaterWasteRate[1] === 1.8305){
      wasteWaterUsage = wasteWaterCost.toFixed(2);
    }
  }

//the visual graph of the calculation
  function showGraph(infraCharges, usageCharges) {
    var values = [infraCharges, usageCharges];
    $('.pieChart').sparkline(values, {
      type: 'pie',
      width: '200px',
      height: '200px',
      offset: '-90',
      sliceColors: ['#EB1005', '#4FE825']
    });
    visual.show();
    $.sparkline_display_visible();
  }

//validate user inputs
  function validate() {
    if(propertyType.val() === 'NULL'){
      propertyType.addClass('invalid');
      return false;
    } else {
      propertyType.removeClass('invalid');
    }
    if(isNaN(parseFloat(landsize.val())) || parseFloat(landsize.val()) <= 0) {
      landsize.addClass('invalid');
      return false;
    } else {
      landsize.removeClass('invalid');
    }
    if(parseFloat(metersize.val()) === 0) {
      metersize.addClass('invalid');
      return false
    } else {
      metersize.removeClass('invalid');
    }
    if(radio.filter(':checked').val() === 'reading') {
      if(isNaN(parseFloat(lastReading.val())) || parseFloat(lastReading.val()) <= 0 ){
        lastReading.addClass('invalid');
        return false;
      } else {
        lastReading.removeClass('invalid');
      }
      if(isNaN(parseFloat(currReading.val())) || parseFloat(currReading.val()) <= 0 ){
        currReading.addClass('invalid');
        return false;
      } else {
        currReading.removeClass('invalid');
      }
      if(parseFloat(currReading.val()) < parseFloat(lastReading.val())) {
        currReading.addClass('invalid');
        return false;
      } else {
        currReading.removeClass('invalid');
      }
    }
    if(radio.filter(':checked').val() === 'consumption' &&
      (isNaN(parseFloat(consumptionInput.val())) || parseFloat(consumptionInput.val()) < 0)) {
      consumptionInput.addClass('invalid');
      return false;
    } else {
      consumptionInput.removeClass('invalid');
    }
    return true;
  }

// calculate the total charges
  function calculate(event){
    if(validate()) {
      if(event.data.option === 'reading'){
        consumption = parseFloat(currReading.val()) - parseFloat(lastReading.val());
      } else {
        consumption = parseFloat(consumptionInput.val());
      }

      totalInfrastructureCharges(list);

      if(propertyType.val() === 'LDM') {
        usageCharges(ratesLDM);
        totalUsageCharge = parseFloat(LDMwaterUsage) + parseFloat(LDMwasteWaterUsage);
      } else {
        usageCharges(rates);
        totalUsageCharge = parseFloat(waterUsage) + parseFloat(wasteWaterUsage);
      }

      totalCharge = (totalUsageCharge + totalInfraCharge).toFixed(2).replace(/./g, function(c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
      });
      $('.result').html('Your estimated bill will be: $' + totalCharge).show();

      //show graph
      showGraph(totalInfraCharge.toFixed(2), totalUsageCharge.toFixed(2));
      $('.error').hide();
    } else {
      $('.error').html('Please enter correct information in the red box.').show();
      $('.result').hide();
      visual.hide();
    }
  }

});
