package com.pharmacy.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_addresses")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "type_tag")
    private String typeTag;

    private String flat;
    private String building;
    private String landmark;

    @Column(name = "full_text", length = 1000)
    private String fullText;

    @Column(name = "receiver_name")
    private String receiverName;

    private String phone;
    private Double lat;
    private Double lng;

    @Column(name = "is_primary")
    private boolean primary;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTypeTag() { return typeTag; }
    public void setTypeTag(String typeTag) { this.typeTag = typeTag; }

    public String getFlat() { return flat; }
    public void setFlat(String flat) { this.flat = flat; }

    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }

    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }

    public String getFullText() { return fullText; }
    public void setFullText(String fullText) { this.fullText = fullText; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public boolean isPrimary() { return primary; }
    public void setPrimary(boolean primary) { this.primary = primary; }
}
