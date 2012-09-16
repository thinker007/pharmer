-- phpMyAdmin SQL Dump
-- version 3.4.10.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 16, 2012 at 08:50 PM
-- Server version: 5.5.20
-- PHP Version: 5.3.10

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `pharmer`
--

-- --------------------------------------------------------

--
-- Table structure for table `dosage_form`
--

CREATE TABLE IF NOT EXISTS `dosage_form` (
  `drug_id` int(11) NOT NULL,
  `dosageForm` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `drug`
--

CREATE TABLE IF NOT EXISTS `drug` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uri` varchar(255) CHARACTER SET latin1 NOT NULL,
  `name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `description` mediumtext CHARACTER SET latin1 NOT NULL,
  `absorption` mediumtext,
  `affectedOrganism` mediumtext,
  `biotransformation` mediumtext,
  `halfLife` mediumtext,
  `indication` mediumtext,
  `mechanismOfAction` mediumtext,
  `pharmacology` mediumtext,
  `toxicity` mediumtext,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `drug_brandmixtures`
--

CREATE TABLE IF NOT EXISTS `drug_brandmixtures` (
  `drug_id` int(11) NOT NULL,
  `brandMixture` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `drug_brands`
--

CREATE TABLE IF NOT EXISTS `drug_brands` (
  `drug_id` int(11) NOT NULL,
  `brandName` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `drug_category`
--

CREATE TABLE IF NOT EXISTS `drug_category` (
  `drug_id` int(11) NOT NULL,
  `category` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `drug_contraindication`
--

CREATE TABLE IF NOT EXISTS `drug_contraindication` (
  `drug_id` int(11) NOT NULL,
  `contraindication` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `drug_enzyme`
--

CREATE TABLE IF NOT EXISTS `drug_enzyme` (
  `drug_id` int(11) NOT NULL,
  `enzyme` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `drug_interaction`
--

CREATE TABLE IF NOT EXISTS `drug_interaction` (
  `drug_id` int(11) NOT NULL,
  `drug2_uri` varchar(255) NOT NULL,
  `interaction_uri` varchar(255) NOT NULL,
  `description` tinytext
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `drug_target`
--

CREATE TABLE IF NOT EXISTS `drug_target` (
  `drug_id` int(11) NOT NULL,
  `target` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `food_interaction`
--

CREATE TABLE IF NOT EXISTS `food_interaction` (
  `drug_id` int(11) NOT NULL,
  `interaction` mediumtext NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `searched_terms`
--

CREATE TABLE IF NOT EXISTS `searched_terms` (
  `term` varchar(255) CHARACTER SET latin1 NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `drug_id` int(11) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
