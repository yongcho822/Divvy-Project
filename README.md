# McNulty
A D3 Visualization and Classification Project.

Building a classifcation model that will take input predictor variables (such as time of day, day of wk, weather condition, station) to determine 1 of 3 classes for the station at that particular hour:

1. No notable bike traffic change.
2. Cautionary level of net bike inflow (>25% of the station's total # of bike docks)
3. Cautionary level of net bike outflow (<25% of the station's total # of bike docks)

By examining all of the 2.7 million unique Divvy trips taken in 2014, the goal is to provide a predictive classification model that will help Divvy in planning for future rebalancing efforts, as their ridership and demand grows.

The D3 visualization will be an interactive map with animation properties that will illustrate the varying degrees of bike traffic imbalance throughout the day.
