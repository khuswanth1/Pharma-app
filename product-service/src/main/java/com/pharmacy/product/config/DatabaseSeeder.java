package com.pharmacy.product.config;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmacy.product.entity.Category;
import com.pharmacy.product.entity.Product;
import com.pharmacy.product.repo.CategoryRepository;
import com.pharmacy.product.repo.ProductRepository;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final ObjectMapper mapper = new ObjectMapper();

    public DatabaseSeeder(CategoryRepository categories, ProductRepository products) {
        this.categories = categories;
        this.products = products;
    }

    @Override
    public void run(String... args) throws Exception {
        if (products.count() < 100) {
            System.out.println("Low product count detected. Clearing old seed data and re-seeding from JSON files...");
            products.deleteAll();
            categories.deleteAll();
            seedCategoriesAndProducts();
        }
    }

    private void seedCategoriesAndProducts() {
        File dataDir = findDataDirectory();
        if (dataDir == null || !dataDir.exists()) {
            System.err.println("Could not find pharmacy data directory for seeding!");
            return;
        }

        System.out.println("Seeding database using JSON files from: " + dataDir.getAbsolutePath());

        // Define the mapping between category slugs and the JSON files
        Map<String, String> categoryToFileName = new LinkedHashMap<>();
        categoryToFileName.put("baby-care", "Baby.json");
        categoryToFileName.put("skin-care", "Skin.json");
        categoryToFileName.put("diabetes-care", "Diabetes.json");
        categoryToFileName.put("cardiac-care", "Cardiac.json");
        categoryToFileName.put("stomach-care", "Stomach.json");
        categoryToFileName.put("pain-relief", "Pain.json");
        categoryToFileName.put("liver-care", "Liver.json");
        categoryToFileName.put("oral-care", "Oral.json");
        categoryToFileName.put("respiratory", "Respiratory.json");
        categoryToFileName.put("elderly-care", "Elderly.json");
        categoryToFileName.put("women-health", "WomenHealth.json");
        categoryToFileName.put("first-aid", "FirstAid.json");
        categoryToFileName.put("covid-care", "Covid.json");
        categoryToFileName.put("sexual_care", "Sexual.json");
        categoryToFileName.put("cold-immunity", "Immunity.json");

        // Category descriptions
        Map<String, String> categoryDescriptions = new HashMap<>();
        categoryDescriptions.put("baby-care", "Products for babies and toddlers.");
        categoryDescriptions.put("skin-care", "Derma and skin care ointments.");
        categoryDescriptions.put("diabetes-care", "Insulin, glucometers and diabetes tablets.");
        categoryDescriptions.put("cardiac-care", "Cholesterol and blood pressure management.");
        categoryDescriptions.put("stomach-care", "Antacids, digestives and stomach medicine.");
        categoryDescriptions.put("pain-relief", "Analgesics, sprays and pain relief gels.");
        categoryDescriptions.put("liver-care", "Liver tonics, capsules and supplements.");
        categoryDescriptions.put("oral-care", "Toothpastes, mouthwashes and oral hygiene.");
        categoryDescriptions.put("respiratory", "Inhalers, anti-asthma pills and cough syrups.");
        categoryDescriptions.put("elderly-care", "Adult diapers, joint support and elderly supplements.");
        categoryDescriptions.put("women-health", "Iron tablets, sanitaries and feminine care.");
        categoryDescriptions.put("first-aid", "Bandages, antiseptics and first aid kits.");
        categoryDescriptions.put("covid-care", "Sanitizers, masks and oximeters.");
        categoryDescriptions.put("sexual_care", "Condoms, lubricants and wellness products.");
        categoryDescriptions.put("cold-immunity", "Vitamin C, cold tablets and immunity boosters.");

        // Category names
        Map<String, String> categoryNames = new HashMap<>();
        categoryNames.put("baby-care", "Baby Care");
        categoryNames.put("skin-care", "Skin Care");
        categoryNames.put("diabetes-care", "Diabetes Care");
        categoryNames.put("cardiac-care", "Cardiac Care");
        categoryNames.put("stomach-care", "Stomach Care");
        categoryNames.put("pain-relief", "Pain Relief");
        categoryNames.put("liver-care", "Liver Care");
        categoryNames.put("oral-care", "Oral Care");
        categoryNames.put("respiratory", "Respiratory Care");
        categoryNames.put("elderly-care", "Elderly Care");
        categoryNames.put("women-health", "Women's Health");
        categoryNames.put("first-aid", "First Aid");
        categoryNames.put("covid-care", "Covid Care");
        categoryNames.put("sexual_care", "Sexual Care");
        categoryNames.put("cold-immunity", "Cold & Immunity");

        for (Map.Entry<String, String> entry : categoryToFileName.entrySet()) {
            String slug = entry.getKey();
            String fileName = entry.getValue();

            Category c = new Category();
            c.setName(categoryNames.get(slug));
            c.setDescription(categoryDescriptions.get(slug));
            c.setSlug(slug);
            Category savedCat = categories.save(c);

            File jsonFile = new File(dataDir, fileName);
            if (jsonFile.exists()) {
                try {
                    seedProductsFromJson(jsonFile, savedCat);
                } catch (Exception e) {
                    System.err.println("Failed to seed products from " + fileName + ": " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.err.println("File not found for category slug " + slug + ": " + jsonFile.getAbsolutePath());
            }
        }
    }

    private File findDataDirectory() {
        // Go up from current user dir to look for "pharmacy/src/data"
        Path currentPath = Paths.get(".").toAbsolutePath();
        while (currentPath != null) {
            Path possibleDataPath = currentPath.resolve("pharmacy").resolve("src").resolve("data");
            if (possibleDataPath.toFile().exists()) {
                return possibleDataPath.toFile();
            }
            possibleDataPath = currentPath.resolve("..").resolve("pharmacy").resolve("src").resolve("data").normalize();
            if (possibleDataPath.toFile().exists()) {
                return possibleDataPath.toFile();
            }
            possibleDataPath = currentPath.resolve("../..").resolve("pharmacy").resolve("src").resolve("data").normalize();
            if (possibleDataPath.toFile().exists()) {
                return possibleDataPath.toFile();
            }
            currentPath = currentPath.getParent();
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void seedProductsFromJson(File jsonFile, Category cat) throws IOException {
        Map<String, Object> data = mapper.readValue(jsonFile, Map.class);
        if (data == null || !data.containsKey("product")) {
            return;
        }

        Map<String, List<Map<String, Object>>> productsMap = (Map<String, List<Map<String, Object>>>) data.get("product");
        List<Product> productsToSave = new ArrayList<>();

        for (Map.Entry<String, List<Map<String, Object>>> entry : productsMap.entrySet()) {
            String subType = entry.getKey();
            List<Map<String, Object>> productList = entry.getValue();

            if (productList == null) continue;

            for (Map<String, Object> pMap : productList) {
                Product p = new Product();
                p.setCategory(cat);
                p.setSubType(subType);
                p.setName((String) pMap.get("name"));
                p.setDescription((String) pMap.get("description"));

                // Handle cost / mrp
                Number cost = (Number) pMap.get("cost");
                if (cost != null) {
                    p.setMrp(BigDecimal.valueOf(cost.doubleValue()));
                }

                // Handle final_price / sellingPrice
                Number finalPrice = (Number) pMap.get("final_price");
                if (finalPrice != null) {
                    p.setSellingPrice(BigDecimal.valueOf(finalPrice.doubleValue()));
                } else {
                    Number sellingPrice = (Number) pMap.get("sellingPrice");
                    if (sellingPrice != null) {
                        p.setSellingPrice(BigDecimal.valueOf(sellingPrice.doubleValue()));
                    } else if (cost != null) {
                        p.setSellingPrice(BigDecimal.valueOf(cost.doubleValue()));
                    }
                }

                // Handle image URL
                Object imagesObj = pMap.get("images");
                if (imagesObj instanceof String) {
                    p.setImageUrl((String) imagesObj);
                } else if (imagesObj instanceof List) {
                    List<?> imgList = (List<?>) imagesObj;
                    if (!imgList.isEmpty()) {
                        p.setImageUrl(String.valueOf(imgList.get(0)));
                    }
                }

                // Default description if missing
                if (p.getDescription() == null || p.getDescription().isEmpty()) {
                    p.setDescription("Premium health product in " + cat.getName());
                }

                // Default images if missing
                if (p.getImageUrl() == null || p.getImageUrl().isEmpty()) {
                    p.setImageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80");
                }

                // Handle rating
                Number ratingNum = (Number) pMap.get("rating");
                if (ratingNum != null) {
                    p.setRating(ratingNum.doubleValue());
                } else {
                    p.setRating(4.5);
                }

                // Handle stock
                Number stockNum = (Number) pMap.get("stock");
                if (stockNum != null) {
                    p.setStock(stockNum.intValue());
                } else {
                    p.setStock(100);
                }

                p.setBrand((String) pMap.get("brand"));
                p.setManufacturer((String) pMap.get("manufacturer"));
                p.setComposition((String) pMap.get("composition"));

                // Highlights mapping
                Map<String, Object> highlights = (Map<String, Object>) pMap.get("highlights");
                if (highlights != null) {
                    p.setPackSize((String) highlights.get("pack_size"));
                }
                if (p.getPackSize() == null) {
                    p.setPackSize((String) pMap.get("net_quantity"));
                }
                if (p.getPackSize() == null) {
                    p.setPackSize("1 strip");
                }

                // Prescription required
                Boolean rx = (Boolean) pMap.get("prescriptionRequired");
                if (rx != null) {
                    p.setPrescriptionRequired(rx);
                } else {
                    p.setPrescriptionRequired(false);
                }

                productsToSave.add(p);
            }
        }

        products.saveAll(productsToSave);
        System.out.println("Seeded " + productsToSave.size() + " products for category: " + cat.getName());
    }
}
