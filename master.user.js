// ==UserScript==
// @name       Better Buy Orders
// @author     Stepan Fedorko-Bartos, Step7750
// @namespace
// @version    1.1
// @description  Improves Steam market buy orders (hot-swap view currency changing and extended listings)
// @match      http://steamcommunity.com/market/listings/*
// @match      https://steamcommunity.com/market/listings/*
// @copyright  2015+, Stepan Fedorko-Bartos
// @grant      none
// ==/UserScript==


/**
 * Created by Step7750-Workstation on 7/2/2015.
 */
// Execute after full page load (ensure the original function is loaded)
window.addEventListener ("load", main_execute, false);


function main_execute() {
  // global variables toggling the state of the extended orders
  window.bbo_buy_enable = 0;
  window.bbo_sell_enable = 0;

  // Injects the hot-swap currency selector
  $J(".market_commodity_order_block").children().eq(1).after('<select id="currency_buyorder" style="margin-left: 10px; margin-bottom: 5px;"><option value="1" selected>USD</option><option value="2">GBP</option><option value="3">EUR</option><option value="5">RUB</option><option value="7">BRL</option><option value="8">JPY</option><option value="9">NOK</option><option value="10">IDR</option><option value="11">MYR</option><option value="12">PHP</option><option value="13">SGD</option><option value="14">THB</option><option value="15">VND</option><option value="16">KRW</option><option value="17">TRY</option><option value="18">UAH</option><option value="19">MXN</option><option value="20">CAD</option><option value="21">AUD</option><option value="22">NZD</option></select>');
  $J("#currency_buyorder").val(typeof( g_rgWalletInfo ) != 'undefined' && g_rgWalletInfo['wallet_currency'] != 0 ? g_rgWalletInfo['wallet_currency'] : 1);

  $J('#currency_buyorder').on('change', function() {
    clearTimeout(buyordertimeout);
    if (ItemActivityTicker.m_llItemNameID != null) {
      Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID);
    }
  });


  // Overwrites Valve's function here: http://steamcommunity-a.akamaihd.net/public/javascript/market.js
  function Market_LoadOrderSpread( item_nameid )
  {
    $J.ajax( {
      url: window.location.protocol + '//steamcommunity.com/market/itemordershistogram',
      type: 'GET',
      data: {
        country: g_strCountryCode,
        language: g_strLanguage,
        currency: $J("#currency_buyorder").val(),
        item_nameid: item_nameid
      }
    } ).error( function ( ) {
      window.buyordertimeout = setTimeout( function() { Market_LoadOrderSpread( item_nameid ); }, 5000 );
    } ).success( function( data ) {
      window.buyordertimeout = setTimeout( function() { Market_LoadOrderSpread( item_nameid ); }, 5000 );
      if ( data.success == 1 )
      {
        // Better Buy Orders
        var buy_order_build_html = '<table class="market_commodity_orders_table"><tr><th align="right">Price</th><th align="right">Quantity</th></tr>';
        var sell_order_build_html = '<table class="market_commodity_orders_table"><tr><th align="right">Price</th><th align="right">Quantity</th></tr>';

        // Make an deep copy object that stores the quantity at each amount
        var quantity_buy_order = $J.extend(true, [], data.buy_order_graph);
        for (var i = 0; i < quantity_buy_order.length; i++) {
          var sum = 0
          for (var x = 0; x < i; x++) {
            sum += quantity_buy_order[x][1];
          }
          quantity_buy_order[i][1] -= sum;
        }

        var quantity_sell_order = $J.extend(true, [], data.sell_order_graph);

        for (var i = 0; i < quantity_sell_order.length; i++) {
          var sum = 0
          for (var x = 0; x < i; x++) {
            sum += quantity_sell_order[x][1];
          }
          quantity_sell_order[i][1] -= sum;
        }

        // Remove the button if there aren't actually more than 6 buy orders of different value
        if (quantity_buy_order.length <=  6) {
          $J("#show_more_buy").hide();
        }
        else if (quantity_buy_order.length >  6) {
          $J("#show_more_buy").show();
        }

        if (quantity_sell_order.length <=  6) {
          $J("#show_more_sell").hide();
        }
        else if (quantity_sell_order.length >  6) {
          $J("#show_more_sell").show();
        }


        for (var i = 0; i < quantity_buy_order.length; i++) {
          // append to the buy order html, account for many currencies, languages
          buy_order_build_html += '<td align="right">' + data.price_prefix + quantity_buy_order[i][0].toFixed(2) + data.price_suffix + '</td><td align="right">' + quantity_buy_order[i][1] + '</td></tr><tr>';
        }
        for (var i = 0; i < quantity_sell_order.length; i++) {
          // append to the buy order html, account for many currencies, languages
          sell_order_build_html += '<td align="right">' + data.price_prefix + quantity_sell_order[i][0].toFixed(2) + data.price_suffix + '</td><td align="right">' + quantity_sell_order[i][1] + '</td></tr><tr>';
        }

        // If there is only one buy order and the total is exact
        var total_shown_buy_orders = null;
        var total_shown_sell_orders = null;
        if (data.buy_order_graph.length > 0) {
          total_shown_buy_orders = data.buy_order_graph[data.buy_order_graph.length - 1][1];
        }
        if (data.sell_order_graph.length > 0) {
          total_shown_sell_orders = data.sell_order_graph[data.sell_order_graph.length - 1][1];
        }

        if ((data.buy_order_summary).search(total_shown_buy_orders) == -1 && data.buy_order_graph.length > 0) {
          // Not all of the possible listings are shown, put the "or more" tag and calculate the remaining orders
          // Get the total amount of buy listings
          var totallistings = $J(data.buy_order_summary).text().split(" ")[0];
          buy_order_build_html += '<td align="right">' + data.price_prefix + (quantity_buy_order[quantity_buy_order.length - 1][0] - 0.01).toFixed(2) + data.price_suffix + ' or less</td><td align="right">' + (totallistings - total_shown_buy_orders) + '</td></tr><tr>';
        }
        if ((data.sell_order_summary).search(total_shown_sell_orders) == -1 && data.sell_order_graph.length > 0) {
          // Not all of the possible listings are shown, put the "or more" tag and calculate the remaining orders
          // Get total amount of buy listings
          var totallistings = $J(data.sell_order_summary).text().split(" ")[0];
          sell_order_build_html += '<td align="right">' + data.price_prefix + (quantity_sell_order[quantity_sell_order.length - 1][0] + 0.01).toFixed(2) + data.price_suffix + ' or more</td><td align="right">' + (totallistings - total_shown_sell_orders) + '</td></tr><tr>';
        }
        sell_order_build_html += '</table>', buy_order_build_html += '</table>';
        // Overwrite the old table
        $J('#market_commodity_forsale').html( data.sell_order_summary );
        $J('#market_commodity_buyrequests').html( data.buy_order_summary );
        if (data.buy_order_graph.length > 0 && bbo_buy_enable == 1) {
          $J('#market_commodity_buyreqeusts_table').html( buy_order_build_html )
        }
        else {
          $J('#market_commodity_buyreqeusts_table').html( data.buy_order_table );
        }
        if (data.sell_order_graph.length > 0 && bbo_sell_enable == 1) {
          $J('#market_commodity_forsale_table').html(sell_order_build_html);
        }
        else {
          $J('#market_commodity_forsale_table').html(data.sell_order_table);
        }


        // The rest of this function is just a copy and paste of some of the original code in this function by Valve

        // set in the purchase dialog the default price to buy things (which should almost always be the price of the cheapest listed item)
        if ( data.lowest_sell_order && data.lowest_sell_order > 0 )
          CreateBuyOrderDialog.m_nBestBuyPrice = data.lowest_sell_order;
        else if ( data.highest_buy_order && data.highest_buy_order > 0 )
          CreateBuyOrderDialog.m_nBestBuyPrice = data.highest_buy_order;

        // update the jplot graph
        // we do this infrequently, since it's really expensive, and makes the page feel sluggish
        if ( Market_OrderSpreadPlotLastRefresh
          && Market_OrderSpreadPlotLastRefresh + (60*60*1000) < $J.now() )
        {
          $J('#orders_histogram').html('');
          Market_OrderSpreadPlot = null;
        }

        if ( Market_OrderSpreadPlot == null )
        {
          Market_OrderSpreadPlotLastRefresh = $J.now();

          $J('#orders_histogram').show();
          var line1 = data.sell_order_graph;
          var line2 = data.buy_order_graph;
          var numYAxisTicks = 11;
          var strFormatPrefix = data.price_prefix;
          var strFormatSuffix = data.price_suffix;
          var lines = [ line1, line2 ];

          Market_OrderSpreadPlot = $J.jqplot('orders_histogram', lines, {
            renderer: $J.jqplot.BarRenderer,
            rendererOptions: {fillToZero: true},
            title:{text: 'Buy and Sell Orders (cumulative)', textAlign: 'left' },
            gridPadding:{left: 45, right:45, top:30},
            axesDefaults:{ showTickMarks:false },
            axes:{
              xaxis:{
                tickOptions:{formatString:strFormatPrefix + '%0.2f' + strFormatSuffix, labelPosition:'start', showMark: false},
                min: data.graph_min_x,
                max: data.graph_max_x
              },
              yaxis: {
                pad: 1,
                tickOptions:{formatString:'%d'},
                numberTicks: numYAxisTicks,
                min: 0,
                max: data.graph_max_y
              }
            },
            grid: {
              gridLineColor: '#414141',
              borderColor: '#414141',
              background: '#262626'
            },
            cursor: {
              show: true,
              zoom: true,
              showTooltip: false
            },
            highlighter: {
              show: true,
              lineWidthAdjust: 2.5,
              sizeAdjust: 5,
              showTooltip: true,
              tooltipLocation: 'n',
              tooltipOffset: 20,
              fadeTooltip: true,
              yvalues: 2,
              formatString: "<span style=\"display: none\">%s%s</span>%s"
            },
            series: [{lineWidth:3, fill: true, fillAndStroke:true, fillAlpha: 0.3, markerOptions:{show: false, style:'circle'}}, {lineWidth:3, fill: true, fillAndStroke:true, fillAlpha: 0.3, color:'#6b8fc3', markerOptions:{show: false, style:'circle'}}],
            seriesColors: [ "#688F3E" ]
          });
        }
      }
    } );
    // End of Valve's original code
    return $J.Deferred().resolve();
  }
  if (ItemActivityTicker.m_llItemNameID != null) {
    Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID);
  }


  if (ItemActivityTicker.m_llItemNameID != null) {
    // Toggle buttons
    $J(".market_commodity_orders_interior").eq(1).append('<div class="btn_grey_black btn_medium" id="show_more_buy" style="margin-bottom: 10px;" onclick="toggle_state(0)"><span>Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_buy_button"></span></span></div>');

    $J(".market_commodity_orders_interior").eq(0).append('<div class="btn_grey_black btn_medium" id="show_more_sell" style="margin-bottom: 10px;" onclick="toggle_state(1)"><span>Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_buy_button"></span></span></div>');
  }

  function toggle_state(type) {
    // 0 = buy table, 1 = sell table
    // Called by the respective buttons

    if (type == 0) {
      //$J("#show_more_buy").slideUp();
      // Valve's spelling error
      $J("#market_commodity_buyreqeusts_table").slideUp('fast', function () {
        if(bbo_buy_enable == 1) {
          bbo_buy_enable = 0;
          $J("#show_more_buy").children().eq(0).html('Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button">');
        }
        else {
          bbo_buy_enable = 1;
          $J("#show_more_buy").children().eq(0).html('Show Less Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button" style="-webkit-transform: rotate(-180deg); -ms-transform: rotate(-180deg); transform: rotate(-180deg);">');
        }
        // Delay it a bit since to make sure the DOM was 100% complete being modified
        clearTimeout(buyordertimeout);
        Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID).done(setTimeout(function() {$J("#market_commodity_buyreqeusts_table").slideDown()}, 100));
        //$J("#show_more_buy").slideDown();
      });
    }
    else {
      $J("#market_commodity_forsale_table").slideUp();

      //$J("#show_more_sell").slideUp();
      $J("#market_commodity_forsale_table").slideUp('fast', function () {
        if(bbo_sell_enable == 1) {
          bbo_sell_enable = 0;
          $J("#show_more_sell").children().eq(0).html('Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button">');
        }
        else {
          bbo_sell_enable = 1;
          $J("#show_more_sell").children().eq(0).html('Show Less Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button" style="-webkit-transform: rotate(-180deg); -ms-transform: rotate(-180deg); transform: rotate(-180deg);">');
        }
        // Delay it a bit since to make sure the DOM was 100% complete being modified
        clearTimeout(buyordertimeout);
        Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID).done(setTimeout(function() {$J("#market_commodity_forsale_table").slideDown()}, 100));
        //$J("#show_more_sell").slideDown();
      });
    }
  }


  addJS_Node (Market_LoadOrderSpread);
  addJS_Node (toggle_state);

  function addJS_Node (text, s_URL, funcToRun, runOnLoad) {
    var D                                   = document;
    var scriptNode                          = D.createElement ('script');
    if (runOnLoad) {
      scriptNode.addEventListener ("load", runOnLoad, false);
    }
    scriptNode.type                         = "text/javascript";
    if (text)       scriptNode.textContent  = text;
    if (s_URL)      scriptNode.src          = s_URL;
    if (funcToRun)  scriptNode.textContent  = '(' + funcToRun.toString() + ')()';

    var targ = D.getElementsByTagName ('head')[0] || D.body || D.documentElement;
    targ.appendChild (scriptNode);
  }

  console.log('%c Better Buy Orders (v0.4) by Step7750', 'background: #222; color: #fff;');
}
