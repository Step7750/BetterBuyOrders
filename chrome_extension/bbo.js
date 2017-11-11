// Changelog can be found at: https://github.com/Step7750/BetterBuyOrders

// We need to replace some page functions immediately after the body is loaded
document.addEventListener("DOMContentLoaded", beforescript, false);

// Execute main_execute after full page load (added readyState for Mac systems)
if (document.readyState == 'complete') {
  main_execute();
}
else {
  window.addEventListener ("load", main_execute, false);
}

function addJS_Node(text, s_URL, funcToRun, runOnLoad) {
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

function BBO_GetCurrencySelector() {
    const select = $J('<select id="currency_buyorder" style="margin: 5px 0 5px 10px;">');

    for (const code of Object.keys(g_rgCurrencyData)) {
        const currency = g_rgCurrencyData[code];
        select.append(`<option value="${currency.eCurrencyCode}" selected>${code}</option>`);
    }

    return select;
}

addJS_Node(BBO_GetCurrencySelector);

function main_execute() {
    function dom_changes() {
      if ($J(".market_commodity_order_block").length > 0) {
        // Injects the hot-swap currency selector for commodity items
        $J("#largeiteminfo_item_actions").show();
        $J(".market_commodity_order_block").children().eq(1).after(BBO_GetCurrencySelector());
      }
      else if ($J("#market_buyorder_info_details_tablecontainer").length > 0 && window.nolistings == 0) {
          // append the currency selector for weapon pages (with listings)
          $J("#market_buyorder_info_details_tablecontainer").prepend(BBO_GetCurrencySelector());
      }

      // set the proper value for the currency selector
      $J("#currency_buyorder").val((g_rgWalletInfo && g_rgWalletInfo['wallet_currency']) || 1);

      // bind event handler to currency selector
      $J('#currency_buyorder').on('change', function() {
          if ((ItemActivityTicker.m_llItemNameID && $J(".market_commodity_order_block").length > 0)) {
              Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID);
              // update item activity
              ItemActivityTicker.Load();
          }
          else if ($J("#market_buyorder_info_details_tablecontainer").length > 0 && itemid) {
              Market_LoadOrderSpread(itemid);
          }
      });

      // Start up the request if it is a commodity page
      if (ItemActivityTicker.m_llItemNameID != null) {
          Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID);
      }

      // add toggle buttons for commodity or item pages
      if (ItemActivityTicker.m_llItemNameID != null) {
          // Toggle buttons
          $J(".market_commodity_orders_interior").eq(1).append('<div class="btn_grey_black btn_medium" id="show_more_buy" style="margin-bottom: 10px;" onclick="toggle_state(0)"><span>Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_buy_button"></span></span></div>');

          $J(".market_commodity_orders_interior").eq(0).append('<div class="btn_grey_black btn_medium" id="show_more_sell" style="margin-bottom: 10px;" onclick="toggle_state(1)"><span>Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_buy_button"></span></span></div>');
      }
      else if (window.nolistings == 0) {
          // buttons for item pages with listings
          $J("#market_buyorder_info_details_tablecontainer").append('<center><div class="btn_grey_black btn_medium" id="show_more_buy" style="margin-bottom: 10px;" onclick="toggle_state(0)"><span>Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_buy_button"></span></span></div></center>');
      }
    }

    addJS_Node(dom_changes);
    addJS_Node("dom_changes();");

    window.editeddom = 1;

    console.log('%c Better Buy Orders (v1.6) by Step7750 ', 'background: #222; color: #fff;');
    console.log('%c Changelog can be found here: https://github.com/Step7750/BetterBuyOrders', 'background: #222; color: #fff;');
}

function beforescript() {
    function toggle_state(type) {
        // 0 = buy table, 1 = sell table
        // Called by the respective buttons

        if (type == 0) {
            // Valve's spelling error
            $J("#market_commodity_buyreqeusts_table").slideUp('fast', function () {
                if(window.bbo_buy_enable == 1) {
                    bbo_buy_enable = 0;
                    $J("#show_more_buy").children().eq(0).html('Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button">');
                }
                else {
                    window.bbo_buy_enable = 1;
                    $J("#show_more_buy").children().eq(0).html('Show Less Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button" style="-webkit-transform: rotate(-180deg); -ms-transform: rotate(-180deg); transform: rotate(-180deg);">');
                }
                window.show_tables = 1;
                Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID)
            });
        }
        else {
            $J("#market_commodity_forsale_table").slideUp('fast', function () {
                if(window.bbo_sell_enable == 1) {
                    window.bbo_sell_enable = 0;
                    $J("#show_more_sell").children().eq(0).html('Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button">');
                }
                else {
                    window.bbo_sell_enable = 1;
                    $J("#show_more_sell").children().eq(0).html('Show Less Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button" style="-webkit-transform: rotate(-180deg); -ms-transform: rotate(-180deg); transform: rotate(-180deg);">');
                }
                window.show_tables = 1;
                // Updated the call to just show the tables if needed within the construction function
                Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID)
            });
        }
    }

    function escapeHtml(text) {
        // escape any messed up item names (prevent cross scripting)
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Overwrites Valve's function here: http://steamcommunity-a.akamaihd.net/public/javascript/market.js
    function Market_LoadOrderSpread(item_nameid)
    {
        window.proccessed_order = 1;
        if (!item_nameid) {
            item_nameid = window.itemid;
        }
        else {
            window.itemid = item_nameid;
        }

        $J.ajax( {
            url: window.location.protocol + '//steamcommunity.com/market/itemordershistogram',
            type: 'GET',
            data: {
                country: g_strCountryCode,
                language: g_strLanguage,
                currency: $J("#currency_buyorder").val() || (typeof( g_rgWalletInfo ) != 'undefined' && g_rgWalletInfo['wallet_currency'] != 0 ? g_rgWalletInfo['wallet_currency'] : 1),
                item_nameid: item_nameid,
                two_factor: BIsTwoFactorEnabled() ? 1 : 0
            }
        } ).error( function ( ) {
        } ).success( function( data ) {
            if ( data.success == 1 )
            {
                // Better Buy Orders

                // configure the initial table HTML
                var buy_order_build_html = '<table class="market_commodity_orders_table"><tr>' + $J(data.buy_order_table).children("tbody").eq(0).children("tr").eq(0).html() + '</tr>';
                var sell_order_build_html = '<table class="market_commodity_orders_table"><tr>' + $J(data.buy_order_table).children("tbody").eq(0).children("tr").eq(0).html() + '</tr>';

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
                    var totallistings = $J(data.buy_order_summary.replace("Ceny ", "")).text().split(" ")[0];

                    // Update for localization, get the "or more" or "or less" text from the response rather than hard coding in english
                    var orless = $J(data.buy_order_table).children("tbody").eq(0).children().last().children().eq(0).text().replace(data.price_prefix, "").replace(data.price_suffix, "").replace(/\d+([,.]\d+)?/, "").trim();
                    buy_order_build_html += '<td align="right">' + data.price_prefix + (quantity_buy_order[quantity_buy_order.length - 1][0] - 0.01).toFixed(2) + data.price_suffix + ' ' + orless + '</td><td align="right">' + (totallistings - total_shown_buy_orders) + '</td></tr><tr>';
                }
                if ((data.sell_order_summary).search(total_shown_sell_orders) == -1 && data.sell_order_graph.length > 0) {
                    // Not all of the possible listings are shown, put the "or more" tag and calculate the remaining orders
                    // Get total amount of buy listings
                    var totallistings = $J(data.sell_order_summary.replace("Ceny ", "")).text().split(" ")[0];

                    var ormore = $J(data.sell_order_table).children("tbody").eq(0).children().last().children().eq(0).text().replace(data.price_prefix, "").replace(data.price_suffix, "").replace(/\d+([,.]\d+)?/, "").trim();
                    sell_order_build_html += '<td align="right">' + data.price_prefix + (quantity_sell_order[quantity_sell_order.length - 1][0] + 0.01).toFixed(2) + data.price_suffix + ' ' + ormore + '</td><td align="right">' + (totallistings - total_shown_sell_orders) + '</td></tr><tr>';
                }
                sell_order_build_html += '</table>', buy_order_build_html += '</table>';
                // Overwrite the old table
                $J('#market_commodity_forsale').html( data.sell_order_summary );
                $J('#market_commodity_buyrequests').html( data.buy_order_summary );
                if (data.buy_order_graph.length > 0 && window.bbo_buy_enable == 1) {
                    $J('#market_commodity_buyreqeusts_table').html( buy_order_build_html )
                }
                else {
                    $J('#market_commodity_buyreqeusts_table').html( data.buy_order_table );
                }
                if (data.sell_order_graph.length > 0 && window.bbo_sell_enable == 1) {
                    $J('#market_commodity_forsale_table').html(sell_order_build_html);
                }
                else {
                    $J('#market_commodity_forsale_table').html(data.sell_order_table);
                }


                // Create animations
                if (window.show_tables == 1) {
                    if ($J("#market_commodity_buyreqeusts_table").is(":hidden")) {
                        $J("#market_commodity_buyreqeusts_table").hide().slideDown();
                    }
                    else {
                        $J("#market_commodity_forsale_table").hide().slideDown();
                    }
                    window.show_tables = 0;
                }


                // The rest of this function is just a copy and paste of some of the original code in this function by Valve



                // set in the purchase dialog the default price to buy things (which should almost always be the price of the cheapest listed item)
                if ( data.lowest_sell_order && data.lowest_sell_order > 0 )
                    CreateBuyOrderDialog.m_nBestBuyPrice = data.lowest_sell_order;
                else if ( data.highest_buy_order && data.highest_buy_order > 0 )
                    CreateBuyOrderDialog.m_nBestBuyPrice = data.highest_buy_order;

                // update the jplot graph
                // we do this infrequently, since it's really expensive, and makes the page feel sluggish
                var $elOrdersHistogram = $J('#orders_histogram');
                if ( Market_OrderSpreadPlotLastRefresh
                    && Market_OrderSpreadPlotLastRefresh + (60*60*1000) < $J.now()
                    && $elOrdersHistogram.length )
                {
                    $elOrdersHistogram.html('');
                    Market_OrderSpreadPlot = null;
                }

                if ( Market_OrderSpreadPlot == null && $elOrdersHistogram.length )
                {
                    Market_OrderSpreadPlotLastRefresh = $J.now();

                    $elOrdersHistogram.show();
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
    }

    function inject_iat_load() {
      ItemActivityTicker.Load =  function() {
        // overwrite currency selection
        $J.ajax( {
            url: 'http://steamcommunity.com/market/itemordersactivity',
            type: 'GET',
            data: {
                country: g_strCountryCode,
                language: g_strLanguage,
                currency: ($J("#currency_buyorder").val()) || (typeof( g_rgWalletInfo ) != 'undefined' && g_rgWalletInfo['wallet_currency'] != 0 ? g_rgWalletInfo['wallet_currency'] : 1),
                item_nameid: this.m_llItemNameID || itemid,
                two_factor: BIsTwoFactorEnabled() ? 1 : 0
            }
        } ).fail( function( jqxhr ) {
            setTimeout( function() { ItemActivityTicker.Load(); }, 10000 );
        } ).done( function( data ) {
            setTimeout( function() { ItemActivityTicker.Load(); }, 10000 );
            if ( data.success == 1 )
            {
                if ( data.timestamp > ItemActivityTicker.m_nTimeLastLoaded )
                {
                    ItemActivityTicker.m_nTimeLastLoaded = data.timestamp;
                    ItemActivityTicker.Update( data.activity );
                }
            }
        } );
      }
    }

    addJS_Node("window.bbo_buy_enable = 0;window.bbo_sell_enable = 0;window.itemid = null;window.show_tables = 0;window.editeddom = 0;window.nolistings = 0;window.proccessed_order = 0;");
    addJS_Node(escapeHtml);
    addJS_Node(Market_LoadOrderSpread);
    addJS_Node(toggle_state);
    addJS_Node(inject_iat_load);
    addJS_Node("inject_iat_load()");
}
