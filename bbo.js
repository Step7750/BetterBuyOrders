// Changelog can be found at: https://github.com/Step7750/BetterBuyOrders

// We need to replace some page functions immediately after the body is loaded
document.addEventListener("DOMContentLoaded", BeforeScript, false);

// Execute MainScript after full page load (added readyState for Mac systems)
if (document.readyState == 'complete') {
  MainScript();
}
else {
  window.addEventListener ("load", MainScript, false);
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

function BBO_GetOrderButton(type) {
    const id = (type === BBO_BUY) ? 'show_more_buy': 'show_more_sell';

    return `
        <center>
            <div class="btn_grey_black btn_medium" id="${id}" style="margin-bottom: 10px;" onclick="BBO_toggleState(${type})">
                <span>Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_buy_button"></span></span>
            </div>
        </center>
    `;
}

addJS_Node(BBO_GetCurrencySelector);
addJS_Node(BBO_GetOrderButton);

function MainScript() {
    function BBO_MainExecute() {
      if ($J(".market_commodity_order_block").length > 0) {
        // Injects the hot-swap currency selector for commodity items
        $J("#largeiteminfo_item_actions").show();
        $J(".market_commodity_order_block").children().eq(1).after(BBO_GetCurrencySelector());
      }
      else if ($J("#market_buyorder_info_details_tablecontainer").length > 0) {
          // append the currency selector for weapon pages (with listings)
          $J("#market_buyorder_info_details_tablecontainer").prepend(BBO_GetCurrencySelector());
      }

      // set the proper value for the currency selector
      $J("#currency_buyorder").val((typeof g_rgWalletInfo !== 'undefined' && g_rgWalletInfo['wallet_currency']) || 1);

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
      if (ItemActivityTicker.m_llItemNameID) {
          Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID);
      }


      if (ItemActivityTicker.m_llItemNameID) {
          // Commodity Page
          $J(".market_commodity_orders_interior").eq(1).append(BBO_GetOrderButton(BBO_BUY));
          $J(".market_commodity_orders_interior").eq(0).append(BBO_GetOrderButton(BBO_SELL));
      }
      else {
          // Item Page
          $J("#market_buyorder_info_details_tablecontainer").append(BBO_GetOrderButton(BBO_BUY));
      }
    }

    addJS_Node(BBO_MainExecute);
    addJS_Node("BBO_MainExecute();");

    console.log('%c Better Buy Orders (v1.6.2) by Step7750 ', 'background: #222; color: #fff;');
    console.log('%c Changelog can be found here: https://github.com/Step7750/BetterBuyOrders ', 'background: #222; color: #fff;');
}

function BeforeScript() {
    function BBO_toggleState(type) {
        // 0 = buy table, 1 = sell table
        // Called by the respective buttons

        const tableId = (type === BBO_BUY) ? 'market_commodity_buyreqeusts_table' : 'market_commodity_forsale_table';
        const btnId = (type === BBO_BUY) ? 'show_more_buy' : 'show_more_sell';

        $J(`#${tableId}`).slideUp('fast', () => {
            const state = BBO_State[type];

            BBO_State[type] = !state;

            if (state) {
                $J(`#${btnId}`).children().eq(0).html('Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button">');
            }
            else {
                $J(`#${btnId}`).children().eq(0).html('Show Less Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button" style="-webkit-transform: rotate(-180deg); -ms-transform: rotate(-180deg); transform: rotate(-180deg);">');
            }

            window.BBO_AnimateTables = true;
            Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID);
        });
    }

    // Overwrites Valve's function here: http://steamcommunity-a.akamaihd.net/public/javascript/market.js
    function Market_LoadOrderSpread(item_nameid)
    {
        if (!item_nameid) {
            item_nameid = window.itemid;
        }
        else {
            window.itemid = item_nameid;
        }

        const currency = parseInt($J("#currency_buyorder").val() || (typeof g_rgWalletInfo !== 'undefined' && g_rgWalletInfo['wallet_currency']) || 1);
        const strCode = Object.keys(g_rgCurrencyData).find((code) => g_rgCurrencyData[code].eCurrencyCode === currency);


        $J.ajax( {
            url: window.location.protocol + '//steamcommunity.com/market/itemordershistogram',
            type: 'GET',
            data: {
                country: g_strCountryCode,
                language: g_strLanguage,
                currency: currency,
                item_nameid: item_nameid,
                two_factor: BIsTwoFactorEnabled() ? 1 : 0
            }
        } ).error( function ( ) {
        } ).success( function( data ) {
            if ( data.success == 1 )
            {
                $J('#market_commodity_forsale').html( data.sell_order_summary );
                $J('#market_commodity_buyrequests').html( data.buy_order_summary );

                // Better Buy Orders

                // configure the initial table HTML
                let buyOrderTable = '<table class="market_commodity_orders_table"><tr>' + $J(data.buy_order_table).children("tbody").eq(0).children("tr").eq(0).html() + '</tr>';
                let sellOrderTable = '<table class="market_commodity_orders_table"><tr>' + $J(data.buy_order_table).children("tbody").eq(0).children("tr").eq(0).html() + '</tr>';

                // Make an deep copy object that stores the quantity at each amount
                const buyOrderQuantity = $J.extend(true, [], data.buy_order_graph);

                for (let i = 0; i < buyOrderQuantity.length; i++) {
                    let sum = 0;

                    for (let x = 0; x < i; x++) {
                        sum += buyOrderQuantity[x][1];
                    }
                    buyOrderQuantity[i][1] -= sum;
                }

                const sellOrderQuantity = $J.extend(true, [], data.sell_order_graph);

                for (let i = 0; i < sellOrderQuantity.length; i++) {
                    let sum = 0;
                    for (let x = 0; x < i; x++) {
                        sum += sellOrderQuantity[x][1];
                    }
                    sellOrderQuantity[i][1] -= sum;
                }

                // Append table rows for quantity
                for (let i = 0; i < buyOrderQuantity.length; i++) {
                    // append to the buy order html, account for many currencies, languages
                    buyOrderTable += `
                        <tr>
                            <td align="right">${v_currencyformat(buyOrderQuantity[i][0]*100, strCode)}</td>
                            <td align="right">${buyOrderQuantity[i][1]}</td>
                        </tr>`;
                }

                for (let i = 0; i < sellOrderQuantity.length; i++) {
                    sellOrderTable += `
                        <tr>
                            <td align="right">${v_currencyformat(sellOrderQuantity[i][0]*100, strCode)}</td>
                            <td align="right">${sellOrderQuantity[i][1]}</td>
                        </tr>`;
                }

                // Remove the buttons if there aren't actually more than 6 buy orders of different value
                if (buyOrderQuantity.length <=  6) {
                    $J("#show_more_buy").hide();
                }
                else if (buyOrderQuantity.length >  6) {
                    $J("#show_more_buy").show();
                }

                if (sellOrderQuantity.length <=  6) {
                    $J("#show_more_sell").hide();
                }
                else if (sellOrderQuantity.length >  6) {
                    $J("#show_more_sell").show();
                }

                // Get the total amount of shown by orders
                const totalShownBuyOrders = (data.buy_order_graph.length > 0) ?
                    data.buy_order_graph[data.buy_order_graph.length - 1][1] : 0;
                const totalShownSellOrders = (data.sell_order_graph.length > 0) ?
                    data.sell_order_graph[data.sell_order_graph.length - 1][1] : 0;

                if ((data.buy_order_summary).search(totalShownBuyOrders) === -1 && data.buy_order_graph.length > 0) {
                    // Not all of the possible listings are shown, put the "or more" tag and calculate the remaining orders
                    // Get the total amount of buy listings
                    const r = /<span class="market_commodity_orders_header_promote">(\d+)<\/span>/;
                    const totalBuyOrders = parseInt(data.buy_order_summary.match(r)[1]);

                    // Figure out the "or less" text for the language chosen
                    const rlang = /.*\d\S? (.*)/;

                    const lastRowText = $J(data.buy_order_table).children("tbody").eq(0).children().last().children().eq(0).text();
                    const orLessText = lastRowText.match(rlang)[1];

                    buyOrderTable += `
                        <tr>
                            <td align="right">
                                ${v_currencyformat(buyOrderQuantity[buyOrderQuantity.length - 1][0]*100 - 1, strCode)} ${orLessText}
                            </td>
                            <td align="right">
                                ${totalBuyOrders - totalShownBuyOrders}
                            </td>
                        </tr>
                    `;
                }

                if ((data.sell_order_summary).search(totalShownSellOrders) == -1 && data.sell_order_graph.length > 0) {
                    // Not all of the possible listings are shown, put the "or more" tag and calculate the remaining orders
                    // Get total amount of buy listings
                    const r = /<span class="market_commodity_orders_header_promote">(\d+)<\/span>/;
                    const totalSellOrders = parseInt(data.sell_order_summary.match(r)[1]);

                    // Figure out the "or more" text for the language chosen
                    const rlang = /.*\d\S? (.*)/;

                    const lastRowText = $J(data.sell_order_table).children("tbody").eq(0).children().last().children().eq(0).text();
                    const orMoreText = lastRowText.match(rlang)[1];

                    sellOrderTable += `
                        <tr>
                            <td align="right">
                                ${v_currencyformat(sellOrderQuantity[sellOrderQuantity.length - 1][0]*100 + 1, strCode)} ${orMoreText}
                            </td>
                            <td align="right">
                                ${totalSellOrders - totalShownSellOrders}
                            </td>
                        </tr>
                    `;
                }

                sellOrderTable += '</table>';
                buyOrderTable += '</table>';


                // Overwrite the old tables if chosen
                if (data.buy_order_graph.length > 0 && BBO_State[BBO_BUY]) {
                    $J('#market_commodity_buyreqeusts_table').html(buyOrderTable)
                }
                else {
                    $J('#market_commodity_buyreqeusts_table').html(data.buy_order_table);
                }

                if (data.sell_order_graph.length > 0 && BBO_State[BBO_SELL]) {
                    $J('#market_commodity_forsale_table').html(sellOrderTable);
                }
                else {
                    $J('#market_commodity_forsale_table').html(data.sell_order_table);
                }


                // Check if we need to animate a table into existence
                if (window.BBO_AnimateTables) {
                    if ($J("#market_commodity_buyreqeusts_table").is(":hidden")) {
                        $J("#market_commodity_buyreqeusts_table").hide().slideDown();
                    }
                    else {
                        $J("#market_commodity_forsale_table").hide().slideDown();
                    }

                    window.BBO_AnimateTables = false;
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
                    var numXAxisTicks = null;
                    if ( $J(window).width() < 400 )
                    {
                        numXAxisTicks = 3;
                    }
                    else if ( $J(window).width() < 600 )
                    {
                        numXAxisTicks = 4;
                    }

                    var numYAxisTicks = 11;
                    var strFormatPrefix = data.price_prefix;
                    var strFormatSuffix = data.price_suffix;
                    var lines = [ line1, line2 ];

                    Market_OrderSpreadPlot = $J.jqplot('orders_histogram', lines, {
                        renderer: $J.jqplot.BarRenderer,
                        rendererOptions: {fillToZero: true},
                        title:{text: 'Buy and Sell Orders (cumulative)', textAlign: 'left' },
                        gridPadding:{left: 45, right:45, top:45},
                        axesDefaults:{ showTickMarks:false },
                        axes:{
                            xaxis:{
                                tickOptions:{formatString:strFormatPrefix + '%0.2f' + strFormatSuffix, labelPosition:'start', showMark: false},
                                numberTicks: numXAxisTicks,
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
                            gridLineColor: '#1b2939',
                            borderColor: '#1b2939',
                            background: '#101822'
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

    function overrideItemActivityTickerLoad() {
      ItemActivityTicker.Load =  function() {
        const currency = $J("#currency_buyorder").val() || (typeof g_rgWalletInfo !== 'undefined' && g_rgWalletInfo['wallet_currency']) || 1;

        // overwrite currency selection
        $J.ajax( {
            url: 'http://steamcommunity.com/market/itemordersactivity',
            type: 'GET',
            data: {
                country: g_strCountryCode,
                language: g_strLanguage,
                currency: currency,
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

    addJS_Node('BBO_State = [false, false]; const BBO_BUY = 0, BBO_SELL = 1;');
    addJS_Node(Market_LoadOrderSpread);
    addJS_Node(BBO_toggleState);
    addJS_Node(overrideItemActivityTickerLoad);
    addJS_Node("overrideItemActivityTickerLoad()");
}
