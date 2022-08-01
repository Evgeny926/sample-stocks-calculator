# sample-stocks-calculator
Sample stocks calculator to convert stock price (OHLC) to selected currency using latest closing date of currency trade. Additionally, it shows volume.

## Before using:
Install dependencies.

Set up API keys in config.json

## Usage:
`http://localhost:3000/stock?symbol=StockSymbol&date=Date&currency=Currency`

where

`StockSymbol` - company symbol.

`Date` - date of stock price.

`Currency` - currency price to covert to.

## Example:
`http://localhost:3000/stock?symbol=IBM&date=2022-07-29&currency=ZAR`
