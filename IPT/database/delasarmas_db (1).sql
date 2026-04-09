-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 09, 2026 at 12:31 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

CREATE DATABASE IF NOT EXISTS `delasarmas_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `delasarmas_db`;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `delasarmas_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `addons`
--

CREATE TABLE `addons` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addons`
--

INSERT INTO `addons` (`id`, `name`, `price`, `description`, `category`, `created_at`) VALUES
(1, 'Tables', 500.00, NULL, NULL, '2026-03-09 15:44:07'),
(2, 'Chairs', 300.00, NULL, NULL, '2026-03-09 15:44:07'),
(3, 'Backdrop', 2000.00, NULL, NULL, '2026-03-09 15:44:07'),
(4, 'Sansrival', 1100.00, NULL, NULL, '2026-03-09 15:44:07'),
(5, 'Fruit Salad', 790.00, NULL, NULL, '2026-03-09 15:44:07'),
(6, 'Buko Pandan', 790.00, NULL, NULL, '2026-03-09 15:44:07');

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `access_level` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `email`, `password`, `access_level`, `created_at`) VALUES
(3, '', 'admin@admin.com', '$2b$10$j4tkD16QCQ5OTiJZzi2liOMlhlRl1hWe4HngpE1Rq6hzArDGaSrRO', 1, '2026-02-26 14:34:41'),
(4, '', 'admin@delasarmas.com', '$2b$10$7zV.mY/NlHnN9.l1l.l1luR6f5V6n6H6f6f6f6f6f6f6f6f6f6f6f', 1, '2026-03-04 15:04:55');

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_type` enum('package','addon') NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `guestCount` int(11) DEFAULT 1,
  `variantName` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `daily_order_counts`
-- (See below for the actual view)
--
CREATE TABLE `daily_order_counts` (
`order_date` date
,`total_orders` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `gallery`
--

CREATE TABLE `gallery` (
  `id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int(11) NOT NULL,
  `courseName` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`id`, `courseName`, `price`, `category`, `description`, `created_at`) VALUES
(3, 'Roast Beef Supreme', 1490.00, 'Beef', NULL, '2026-03-12 12:59:59'),
(4, 'Korean Beef Stew', 1150.00, 'Beef', NULL, '2026-03-12 12:59:59'),
(5, 'Garlic Pepper Beef', 1310.00, 'Beef', NULL, '2026-03-12 12:59:59'),
(6, 'Beef Callos ala Madrilena', 1050.00, 'Beef', NULL, '2026-03-12 12:59:59'),
(7, 'Beef Caldereta', 1290.00, 'Beef', NULL, '2026-03-12 12:59:59'),
(8, 'Beef Kare-Kare with Shrimp Paste', 1340.00, 'Beef', NULL, '2026-03-12 12:59:59'),
(9, 'Pork Sisig', 1150.00, 'Pork', NULL, '2026-03-12 12:59:59'),
(10, 'Crispy Dinuguan', 1100.00, 'Pork', NULL, '2026-03-12 12:59:59'),
(11, 'Garlic Pork Belly', 1180.00, 'Pork', NULL, '2026-03-12 12:59:59'),
(12, 'Barbecued Pork Spareribs', 1240.00, 'Pork', NULL, '2026-03-12 12:59:59'),
(13, 'Kare-Kareng Bagnet', 1340.00, 'Pork', NULL, '2026-03-12 12:59:59'),
(14, 'Lechon Porkchop', 2220.00, 'Pork', NULL, '2026-03-12 12:59:59'),
(15, 'Lemon Rosemary Chicken', 1200.00, 'Chicken', NULL, '2026-03-12 12:59:59'),
(16, 'Grilled Chicken with Mango Salsa', 1340.00, 'Chicken', NULL, '2026-03-12 12:59:59'),
(17, 'Chicken Teriyaki', 1100.00, 'Chicken', NULL, '2026-03-12 12:59:59'),
(18, 'Chicken Cordon Bleu', 1300.00, 'Chicken', NULL, '2026-03-12 12:59:59'),
(19, 'Crusted Chicken Pastel', 1150.00, 'Chicken', NULL, '2026-03-12 12:59:59'),
(20, 'Baked Chicken Parmigiana', 1340.00, 'Chicken', NULL, '2026-03-12 12:59:59'),
(21, 'Crusted Fish Fillet with Aioli or Tartar Dip', 980.00, 'Seafood', NULL, '2026-03-12 12:59:59'),
(22, 'Fish Polvoron with Ham & Cheese', 1080.00, 'Seafood', NULL, '2026-03-12 12:59:59'),
(23, 'Baked Garlic Boneless Bangus', 1180.00, 'Seafood', NULL, '2026-03-12 12:59:59'),
(24, 'Fish ala Creme', 1120.00, 'Seafood', NULL, '2026-03-12 12:59:59'),
(25, 'Seafood ala Pobre', 1500.00, 'Seafood', NULL, '2026-03-12 12:59:59'),
(26, 'Buttered Garlic Shrimp', 1660.00, 'Seafood', NULL, '2026-03-12 12:59:59'),
(27, 'Seafood Kare-Kare', 1680.00, 'Seafood', NULL, '2026-03-12 12:59:59'),
(28, 'Buttered Vegetables', 820.00, 'Vegetables', NULL, '2026-03-12 12:59:59'),
(29, 'Mixed Vegetables with Oyster Sauce', 720.00, 'Vegetables', NULL, '2026-03-12 12:59:59'),
(30, 'Roasted Herbed Mixed Vegetables', 790.00, 'Vegetables', NULL, '2026-03-12 12:59:59'),
(31, 'Vegetable Macaroni with Peanut Sauce', 930.00, 'Vegetables', NULL, '2026-03-12 12:59:59'),
(32, 'Chopsuey', 890.00, 'Vegetables', NULL, '2026-03-12 12:59:59'),
(33, 'Lumpiang Sariwa in Egg Wrapper', 810.00, 'Vegetables', NULL, '2026-03-12 12:59:59'),
(34, 'Bam I', 680.00, 'Noodles and Pasta', NULL, '2026-03-12 12:59:59'),
(35, 'Pancit Canton Guisado', 1200.00, 'Noodles and Pasta', NULL, '2026-03-12 12:59:59'),
(36, 'Garlic Sotanghon', 1100.00, 'Noodles and Pasta', NULL, '2026-03-12 12:59:59'),
(37, 'Korean Chap Chae', 1350.00, 'Noodles and Pasta', NULL, '2026-03-12 12:59:59'),
(38, 'Adobo Aglio Olio', 1300.00, 'Noodles and Pasta', NULL, '2026-03-12 12:59:59'),
(39, 'Pesto Fettuccine', 1400.00, 'Noodles and Pasta', NULL, '2026-03-12 12:59:59'),
(40, 'Pasta Carbonara', 1250.00, 'Noodles and Pasta', NULL, '2026-03-12 12:59:59'),
(41, 'Cheesy Baked Macaroni', 1150.00, 'Noodles and Pasta', NULL, '2026-03-12 12:59:59'),
(42, 'Meaty Baked Lasagna', 1450.00, 'Noodles and Pasta', NULL, '2026-03-12 12:59:59'),
(43, 'Steamed Rice', 450.00, 'Extra', NULL, '2026-03-12 12:59:59'),
(44, 'Garlic Rice', 550.00, 'Extra', NULL, '2026-03-12 12:59:59'),
(45, 'Ube Cake', 850.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(46, 'Yema Cake', 900.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(47, 'Sansrival', 1100.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(48, 'Caramel Cheese Ensaymada', 950.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(49, 'Silvanas', 550.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(50, 'Crema Balls', 190.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(51, 'Chocolate Eclair', 450.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(52, 'Cream Puff', 500.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(53, 'Classic Chocolate Brownie', 600.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(54, 'Buko Pandan', 1000.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(55, 'Mango Sago', 1150.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(56, 'Fruit Salad', 1200.00, 'Dessert', NULL, '2026-03-12 12:59:59'),
(60, 'Roast Beef in Mushroom Sauce', 1240.00, 'Beef', 'Slow-roasted beef drizzled with a rich, savory mushroom cream sauce.', '2026-03-14 03:56:45');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `event_address` text NOT NULL,
  `event_date` date NOT NULL,
  `event_time` varchar(10) DEFAULT NULL,
  `event_start_time` time DEFAULT NULL,
  `event_end_time` time DEFAULT NULL,
  `message_concern` text DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_status` enum('Pending','Paid','Partial') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `guest_count` int(11) DEFAULT 0,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`snapshot`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `customer_name`, `email`, `contact_number`, `event_address`, `event_date`, `event_time`, `event_start_time`, `event_end_time`, `message_concern`, `total_amount`, `payment_status`, `created_at`, `guest_count`, `snapshot`) VALUES
(18, 15, 'Alyssa Mae', 'dionisioalyssamae73@gmail.com', '09566796559', '977 Gil Carlos St. San Jose, Baliuag,Bulacan', '2026-04-09', '10:00 AM –', '10:00:00', '17:00:00', '', 47130.00, 'Pending', '2026-04-06 06:21:14', 100, '{\"selectedPackage\":{\"id\":6,\"name\":\"All-In Package\",\"variant\":\"All-In (70 Guests)\",\"variantName\":\"All-In (70 Guests)\",\"guestCount\":70,\"price\":44550,\"qty\":1},\"addons\":[],\"menuItems\":[{\"id\":\"menu_60__Good_for_6_Pax_\",\"name\":\"Roast Beef in Mushroom Sauce\",\"price\":1240,\"qty\":1,\"variant\":\"(Good for 6 Pax)\",\"category\":\"Beef\"},{\"id\":\"menu_8__Good_for_6_Pax_\",\"name\":\"Beef Kare-Kare with Shrimp Paste\",\"price\":1340,\"qty\":1,\"variant\":\"(Good for 6 Pax)\",\"category\":\"Beef\"}]}');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

CREATE TABLE `packages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `guest_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `packages`
--

INSERT INTO `packages` (`id`, `name`, `price`, `description`, `category`, `image_url`, `created_at`, `guest_count`) VALUES
(1, 'Corporate Package', 55000.00, 'Perfect for weddings, birthdays, or corporate events', 'corporate', NULL, '2026-03-09 15:44:07', 120),
(2, 'Wedding Package', 49500.00, 'An all-in-one package for weddings', 'wedding', NULL, '2026-03-09 15:44:07', 60),
(3, 'Debut Package', 30000.00, 'A perfect debut celebration with great food, beautiful setup, and exceptional service.', 'debut', NULL, '2026-03-09 15:44:07', 50),
(4, 'Birthday Package', 60000.00, 'Make your birthday extra special with our flavorful dishes and professional catering service.', 'birthday', NULL, '2026-03-09 15:44:07', 100),
(5, 'Basic Package', 25000.00, 'Perfect for small gatherings and family events', 'basic', NULL, '2026-03-09 15:44:07', 0),
(6, 'All-In Package', 80000.00, 'Ideal for Baptisms, Weddings, Birthdays, Office & Family Events', 'all-in', NULL, '2026-03-09 15:44:07', 0),
(7, 'Special Package', 45000.00, 'Enjoy delicious catering at special promotional prices for your celebrations and events.', 'special', NULL, '2026-03-09 15:44:07', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reservation_date` date NOT NULL,
  `event_time` varchar(10) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `guest_count` int(11) DEFAULT NULL,
  `special_requests` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`id`, `user_id`, `reservation_date`, `event_time`, `package_id`, `status`, `guest_count`, `special_requests`, `created_at`) VALUES
(70, 15, '2026-04-09', '10:00 AM –', NULL, 'confirmed', 100, '', '2026-04-06 06:21:48');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `rating`, `comment`, `created_at`) VALUES
(15, '15', 5, 'asdaf', '2026-04-06 06:15:48');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `user_id` int(11) NOT NULL,
  `event_address` text DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Paid'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `amount`, `total_amount`, `created_at`, `user_id`, `event_address`, `event_date`, `contact_number`, `status`) VALUES
(196, 23565.00, 47130.00, '2026-04-06 14:21:48', 15, '977 Gil Carlos St. San Jose, Baliuag,Bulacan', '2026-04-09', '09566796559', 'Paid');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `fName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profilePic` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(4) DEFAULT 1,
  `email_domain` varchar(100) DEFAULT NULL,
  `verification_date` datetime DEFAULT NULL,
  `otp` varchar(10) DEFAULT NULL,
  `otp_created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fName`, `email`, `password`, `profilePic`, `email_verified`, `email_domain`, `verification_date`, `otp`, `otp_created_at`) VALUES
(13, 'Takt Hoshino', 'davedellosa31@gmail.com', '$2b$10$Yj5i6tlXa3FSqhYVWLoACupY.KuHCAgDAbZBhXPo5N5eRpqCgGboG', '', 1, 'gmail.com', '2026-03-15 09:55:58', NULL, NULL),
(14, 'Dave Dellosa', 'dellosadaveandrew@gmail.com', '$2b$10$v8rscP46r7M8/QNmIpjAKenCjjDLr/kl0E4hHlphjSKpZshj.3.LK', NULL, 1, 'gmail.com', '2026-03-15 12:32:00', NULL, NULL),
(15, 'Alyssa Mae', 'dionisioalyssamae73@gmail.com', '$2b$10$u8DUdQsLUk9tv0OSR7TtjuKjxJAYcp.lWRK8zDaggP5EtYghm3/0W', NULL, 1, 'gmail.com', '2026-03-19 10:39:31', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure for view `daily_order_counts`
--
DROP TABLE IF EXISTS `daily_order_counts`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `daily_order_counts`  AS SELECT cast(`sales`.`event_date` as date) AS `order_date`, count(0) AS `total_orders` FROM `sales` GROUP BY cast(`sales`.`event_date` as date) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addons`
--
ALTER TABLE `addons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `gallery`
--
ALTER TABLE `gallery`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `packages`
--
ALTER TABLE `packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `package_id` (`package_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_sales` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addons`
--
ALTER TABLE `addons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- AUTO_INCREMENT for table `gallery`
--
ALTER TABLE `gallery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `packages`
--
ALTER TABLE `packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=197;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`);

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `fk_user_sales` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;