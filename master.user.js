// ==UserScript==
// @name       Better Buy Orders
// @author     Stepan Fedorko-Bartos, Step7750
// @namespace
// @version    1.3
// @description  Improves Steam market buy orders (hot-swap view currency changing and extended listings)
// @match      http://steamcommunity.com/market/listings/*
// @match      https://steamcommunity.com/market/listings/*
// @copyright  2015+, Stepan Fedorko-Bartos
// @run-at     document-body
// @grant      none
// ==/UserScript==


// Changelog can be found at: https://github.com/Step7750/BetterBuyOrders


window.bbo_buy_enable = 0;
window.bbo_sell_enable = 0;
window.itemid = null;
window.show_tables = 0;
window.editeddom = 0;
window.nolistings = 0;

// We need to replace some page functions immediately after the body is loaded
beforescript();

// Execute main_execute after full page load (added readyState for Mac systems etc...)
if (document.readyState == 'complete') {
    if (editeddom == 0) {
        main_execute();
    }
}
else {
    if (editeddom == 0) {
        window.addEventListener ("load", main_execute, false);
    }
}


function main_execute() {
    // global variables toggling the state of the extended orders
    
    if ($J(".market_commodity_order_block").length > 0) {
        // Injects the hot-swap currency selector for commodity items
        $J(".market_commodity_order_block").children().eq(1).after('<select id="currency_buyorder" style="margin-left: 10px; margin-bottom: 5px;"><option value="1" selected>USD</option><option value="2">GBP</option><option value="3">EUR</option><option value="5">RUB</option><option value="7">BRL</option><option value="8">JPY</option><option value="9">NOK</option><option value="10">IDR</option><option value="11">MYR</option><option value="12">PHP</option><option value="13">SGD</option><option value="14">THB</option><option value="15">VND</option><option value="16">KRW</option><option value="17">TRY</option><option value="18">UAH</option><option value="19">MXN</option><option value="20">CAD</option><option value="21">AUD</option><option value="22">NZD</option></select>');
    }
    else if ($J("#market_buyorder_info_details_tablecontainer").length > 0 && window.nolistings == 0) {
        // append the currency selector for weapon pages (with listings)
        $J("#market_buyorder_info_details_tablecontainer").prepend('<select id="currency_buyorder" style="margin-left: 15px; margin-top: 10px;"><option value="1" selected="">USD</option><option value="2">GBP</option><option value="3">EUR</option><option value="5">RUB</option><option value="7">BRL</option><option value="8">JPY</option><option value="9">NOK</option><option value="10">IDR</option><option value="11">MYR</option><option value="12">PHP</option><option value="13">SGD</option><option value="14">THB</option><option value="15">VND</option><option value="16">KRW</option><option value="17">TRY</option><option value="18">UAH</option><option value="19">MXN</option><option value="20">CAD</option><option value="21">AUD</option><option value="22">NZD</option></select>')
    }
    // set the proper value for the currency selector
    $J("#currency_buyorder").val(typeof( g_rgWalletInfo ) != 'undefined' && g_rgWalletInfo['wallet_currency'] != 0 ? g_rgWalletInfo['wallet_currency'] : 1);

    // bind event handler to currency selector
    $J('#currency_buyorder').on('change', function() {
        if (typeof buyordertimeout !== 'undefined') {
            clearTimeout(buyordertimeout);
        }
        if ((ItemActivityTicker.m_llItemNameID != null && $J(".market_commodity_order_block").length > 0)) {
            Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID);
        }
        else if ($J("#market_buyorder_info_details_tablecontainer").length > 0 && itemid != null) {
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

    
    window.editeddom = 1

    console.log('%c Better Buy Orders (v1.3.1) by Step7750 ', 'background: #222; color: #fff;');
    console.log('%c Changelog can be found here: https://github.com/Step7750/BetterBuyOrders', 'background: #222; color: #fff;')
}

function beforescript() {
    // Replace these functions with versions that work with items with no listings, these may break if Valve starts changing them up
    // Some of the main dom monipulation functions have also been moved here since we didn't want to wait for the subsequent call for updated tables
    
    function toggle_state(type) {
        // 0 = buy table, 1 = sell table
        // Called by the respective buttons

        if (type == 0) {
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
                if (typeof buyordertimeout !== 'undefined') {
                    clearTimeout(buyordertimeout);
                }
                show_tables = 1;
                Market_LoadOrderSpread(ItemActivityTicker.m_llItemNameID)
            });
        }
        else {
            $J("#market_commodity_forsale_table").slideUp('fast', function () {
                if(bbo_sell_enable == 1) {
                    bbo_sell_enable = 0;
                    $J("#show_more_sell").children().eq(0).html('Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button">');
                }
                else {
                    bbo_sell_enable = 1;
                    $J("#show_more_sell").children().eq(0).html('Show Less Orders <span class="popup_menu_pulldown_indicator" id="arrow_sell_button" style="-webkit-transform: rotate(-180deg); -ms-transform: rotate(-180deg); transform: rotate(-180deg);">');
                }
                if (typeof buyordertimeout !== 'undefined') {
                    clearTimeout(buyordertimeout);
                }
                show_tables = 1;
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
    function Market_LoadOrderSpread( item_nameid )
    {
        if (item_nameid == null) {
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
            window.buyordertimeout = setTimeout( function() { Market_LoadOrderSpread( item_nameid ); }, 5000 );
        } ).success( function( data ) {
            window.buyordertimeout = setTimeout( function() { Market_LoadOrderSpread( item_nameid ); }, 5000 );
            if ( data.success == 1 )
            {
                // Better Buy Orders

                if (document.getElementById("market_commodity_buyrequests") == null && ItemActivityTicker.m_llItemNameID == null) {
                    // set that we have a item with no listings (to prevent other dom manipulations)
                    window.nolistings = 1;
                    
                    // need to clear the waiting dialog
                    $J("#market_buyorder_info").remove();
                  
                    // need to find out the item name and append it
                    // We're escaping the text jic Valve changes how they escape the specific area where we get the item name (prevent xss)
                    var itemname = escapeHtml('"' + $J(".market_listing_nav a").eq(1).text() + '"');
                    $J("#searchResultsTable").prepend('<div id="market_buyorder_info" class="market_listing_row"><div><div style="float: right"><a class="btn_green_white_innerfade btn_medium" href="javascript:void(0)" onclick="Market_ShowBuyOrderPopup( 730, ' + itemname + ', ' + itemname + '); return false;"><span>Place buy order...</span></a></div><div id="market_commodity_buyrequests"><span class="market_commodity_orders_header_promote">1684</span> requests to buy at <span class="market_commodity_orders_header_promote">CDN$ 6.72</span> or lower</div></div><div id="market_buyorder_info_show_details"><span onclick="$J(\'#market_buyorder_info_show_details\').hide(); $J(\'#market_buyorder_info_details\').show();"> View more details </span></div><div id="market_buyorder_info_details" style="display: none;"><div id="market_buyorder_info_details_tablecontainer" style="padding-left: 10px; padding-right: 15px;"><div id="market_commodity_buyreqeusts_table" class="market_commodity_orders_table_container"></div><center><div class="btn_grey_black btn_medium" id="show_more_buy" style="margin-bottom: 10px;" onclick="toggle_state(0)"><span>Show More Orders <span class="popup_menu_pulldown_indicator" id="arrow_buy_button"></span></span></div></center></div><div id="market_buyorder_info_details_explanation"><p>You can place an order to buy at a specific price, and the cheapest listing will automatically get matched to the highest buy order.</p><p>For this item, buy orders will be matched with the cheapest option to buy regardless of any unique characteristics.</p><p>If you\'re looking for a specific characteristic, you can search or view the individual listings below.</p></div></div></div>')
                    
                    // append and configure the currency selector
                    $J("#market_buyorder_info_details_tablecontainer").prepend('<select id="currency_buyorder" style="margin-left: 5px; margin-top: 10px;"><option value="1" selected>USD</option><option value="2">GBP</option><option value="3">EUR</option><option value="5">RUB</option><option value="7">BRL</option><option value="8">JPY</option><option value="9">NOK</option><option value="10">IDR</option><option value="11">MYR</option><option value="12">PHP</option><option value="13">SGD</option><option value="14">THB</option><option value="15">VND</option><option value="16">KRW</option><option value="17">TRY</option><option value="18">UAH</option><option value="19">MXN</option><option value="20">CAD</option><option value="21">AUD</option><option value="22">NZD</option></select>');
                    $J("#currency_buyorder").val(typeof( g_rgWalletInfo ) != 'undefined' && g_rgWalletInfo['wallet_currency'] != 0 ? g_rgWalletInfo['wallet_currency'] : 1);
                    
                    // Bind the currency selector event handler
                    $J('#currency_buyorder').on('change', function() {
                        clearTimeout(buyordertimeout);
                        if (itemid != null) {
                            Market_LoadOrderSpread(itemid);
                        }
                    });
                }
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

               
                // Create animations
                if (show_tables == 1) {
                    if ($J("#market_commodity_buyreqeusts_table").is(":hidden")) {
                        $J("#market_commodity_buyreqeusts_table").hide().slideDown();
                    }
                    else {
                        $J("#market_commodity_forsale_table").hide().slideDown();
                    }
                    show_tables = 0;
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
    
    function CreatePriceHistoryGraph( line1, numYAxisTicks, strFormatPrefix, strFormatSuffix )
    {
        // Valve's native functions do work properly on items with no listings, little edits were done...
        if (document.getElementById("pricehistory") != null) {
            var plot = $J.jqplot('pricehistory', [line1], {
                title:{text: 'Median Sale Prices', textAlign: 'left' },
                gridPadding:{left: 45, right:45, top:25},
                axesDefaults:{ showTickMarks:false },
                axes:{
                    xaxis:{
                        renderer:$J.jqplot.DateAxisRenderer,
                        tickOptions:{formatString:'%b %#d<span class="priceHistoryTime"> %#I%p<span>'},
                        pad: 1
                    },
                    yaxis: {
                        pad: 1.1,
                        tickOptions:{formatString:strFormatPrefix + '%0.2f' + strFormatSuffix, labelPosition:'start', showMark: false},
                        numberTicks: numYAxisTicks
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
                    formatString: '<strong>%s</strong><br>%s<br>%d sold'
                },
                series:[{lineWidth:3, markerOptions:{show: false, style:'circle'}}],
                seriesColors: [ "#688F3E" ]
            });

            plot.defaultNumberTicks = numYAxisTicks;
            return plot;
        }
    }


    function InstallMarketActionMenuButtons()
    {
        // Valve's native functions do work properly on items with no listings, little edits were done...
        if (document.getElementById("pricehistory") != null) {
            for ( var listing in g_rgListingInfo ) {
                var asset = g_rgListingInfo[listing].asset;
                if ( typeof g_rgAssets[asset.appid][asset.contextid][asset.id].market_actions != 'undefined' )
                {
                    // add the context menu
                    var elActionMenuButton = $J('<a></a>');
                    elActionMenuButton.attr( 'id', 'listing_' + listing + '_actionmenu_button' );
                    elActionMenuButton.addClass( 'market_actionmenu_button' );
                    elActionMenuButton.attr( 'href', 'javascript:void(0)' );
                    $J('#listing_' + listing + '_image').parent().append( elActionMenuButton );

                    $J(elActionMenuButton).click( $J.proxy( function( elButton, rgAsset ) {
                        HandleMarketActionMenu( elButton.attr( 'id' ), g_rgAssets[rgAsset.appid][rgAsset.contextid][rgAsset.id] );
                    }, null, elActionMenuButton, asset ) );
                }
            }
        }
    }

    function pricehistory_zoomMonthOrLifetime( plotPriceHistory, timePriceHistoryEarliest, timePriceHistoryLatest )
    {
        // Valve's native functions do work properly on items with no listings, little edits were done...
        if (document.getElementById("pricehistory") != null) {
            var timeMonthAgo = new Date( timePriceHistoryLatest.getTime() - ( 30 * 24 * 60 * 60 * 1000 ) );
            plotPriceHistory.resetZoom();

            var days = (timePriceHistoryLatest.getTime() - timePriceHistoryEarliest.getTime()) / ( 24 * 60 * 60 * 1000 );
            if ( days / 7 < 1 )
            {
                var difference = timePriceHistoryLatest.getTime() - timePriceHistoryEarliest.getTime();
                plotPriceHistory.axes.xaxis.ticks = [timePriceHistoryEarliest, new Date( timePriceHistoryEarliest.getTime() + difference * 0.25  ), new Date( timePriceHistoryEarliest.getTime() + difference * 0.5  ), new Date( timePriceHistoryEarliest.getTime() + difference * 0.75  ), timePriceHistoryLatest];
            }
            else
            {
                plotPriceHistory.axes.xaxis.tickInterval = (days / 7) + " days";
            }
            if ( timePriceHistoryEarliest > timeMonthAgo )
                plotPriceHistory.axes.xaxis.min = timePriceHistoryEarliest;
            else
                plotPriceHistory.axes.xaxis.min = timeMonthAgo;
            plotPriceHistory.axes.xaxis.max = timePriceHistoryLatest;

            var rgYAxis = GetYAXisForPriceHistoryGraph( plotPriceHistory, plotPriceHistory.axes.xaxis.min, timePriceHistoryLatest );
            plotPriceHistory.axes.yaxis.min = rgYAxis[0];
            plotPriceHistory.axes.yaxis.max = rgYAxis[1];
            plotPriceHistory.axes.yaxis.numberTicks = rgYAxis[2];
            plotPriceHistory.axes.yaxis.tickInterval = rgYAxis[4];

            plotPriceHistory.replot();

            $J('#pricehistory .jqplot-yaxis').children().first().remove();
            $J('#pricehistory .jqplot-yaxis').children().last().remove();

            return false;
        }
    }
    
    addJS_Node(CreatePriceHistoryGraph);
    addJS_Node(pricehistory_zoomMonthOrLifetime);
    addJS_Node(InstallMarketActionMenuButtons);
    addJS_Node (escapeHtml);
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
}
