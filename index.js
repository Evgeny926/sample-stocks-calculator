const { default: axios } = require('axios');
const express = require('express')
const app = express()
const port = 3000
var config = require('./config.json');

function convertStockCurrency(stock, currencyRate){
    return {
        open:stock.open * currencyRate,
        high:stock.high * currencyRate,
        low:stock.low * currencyRate,
        close:stock.close * currencyRate,
        volume: stock.volume
    }
}

app.get('/stock', (req, res) => {
    //>stock symbol
    let symbol = req.query.symbol;
    //>date
    let date = req.query.date
    //>query currency
    let currency = req.query.currency

    //load from config
    let stockApiKey = config.stockApiKey
    let currencyApiKey = config.currencyApiKey
    //config empty
    if(!stockApiKey || stockApiKey == "" || !currencyApiKey || currencyApiKey == ""){
        res.status(500).send("Not all configuration was provided.")
        return
    }
    //no params check
    if(!symbol || !date || !currency || symbol == "" || date == "" || currency == ""){
        res.status(500).send("Some parameters are not specified.")
        return
    }

    let convertedClosingStockPrice
    //get info about company's trading currency
    let companyCurrency;
    let cmpP = axios(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${stockApiKey}`).then(
        s => {
            if(s.data.bestMatches && s.data.bestMatches.length == 0) {
                return Promise.reject('Error retrieving company information.')
            } else {
                companyCurrency = s.data.bestMatches[0]['8. currency']
            }  
        }
    )

    //get company's closing stock price
    let stockPrice;
    let stkP = axios(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${stockApiKey}`).then(
        s => {
            
            if(!s.data['Time Series (Daily)'] || !s.data['Time Series (Daily)'][date]) {
                return Promise.reject('Error retrieving company stock.')
            } else {
                stockPrice = {
                    open:s.data['Time Series (Daily)'][date]['1. open'],
                    high:s.data['Time Series (Daily)'][date]['2. high'],
                    low:s.data['Time Series (Daily)'][date]['3. low'],
                    close:s.data['Time Series (Daily)'][date]['4. close'],
                    volume:s.data['Time Series (Daily)'][date]['5. volume']
                }
            }  
        })
    

    //once all data recived...
    finalP = Promise.all([stkP,cmpP]).then( s => {
        let currencyClosingRate = 1; 
        //check if the currency requested is not the same as company's currency
        if(companyCurrency && companyCurrency != currency){
        //get exchnage reate if currencies are not the same
            curP = axios(`https://api.polygon.io/v2/aggs/ticker/C:${companyCurrency}${currency}/range/1/day/${date}/${date}?adjusted=true&sort=asc&limit=120&apiKey=${currencyApiKey}`).then(
                s => {
                    if(!s.data.results) {
                        return Promise.reject('Error retrieving currency rate.')
                    } else {
                        currencyClosingRate = s.data.results[0].c
                    }
                }
            )         

            Promise.all([curP]).then(s => {
                convertedClosingStockPrice = convertStockCurrency(stockPrice, currencyClosingRate)
                res.json(convertedClosingStockPrice)
            },
                r => {console.log(r); res.status(500).send(r); return Promise.reject(r)}
            )
        } else if (companyCurrency && companyCurrency == currency) {       
            convertedClosingStockPrice = convertStockCurrency(stockPrice, currencyClosingRate)
            res.json(convertedClosingStockPrice)  
        } else {
            return Promise.reject('Error calculating stock.')
        }
    },
        r => {console.log(r); res.status(500).send(r)}
    )
})

app.listen(port, () => {
  console.log(`Stock app listening on port ${port}`)
})
