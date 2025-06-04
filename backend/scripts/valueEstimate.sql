-- Creating table to store TEST price estimates
CREATE TABLE IF NOT EXISTS `test_estimates` (
  year INT PRIMARY KEY,
  conservative_usd DOUBLE
);

-- Inserting TEST conservative price estimates for next 3 years
INSERT INTO `test_estimates` (year, conservative_usd) VALUES
  (1, 112.00),
  (2, 125.44),
  (3, 140.49);
