import React from "react";


const CROP_IMAGES = {
  wheat:
    "https://images.unsplash.com/photo-1701800774153-d78af2d4e2e4?auto=format&fit=crop&w=700&q=85",

  paddy:
    "https://images.unsplash.com/photo-1655994967766-5de5d2ebb7ac?auto=format&fit=crop&w=700&q=85",

  maize:
    "https://images.unsplash.com/photo-1629828874546-8d46cf1d49d9?auto=format&fit=crop&w=700&q=85",

  cotton:
    "https://images.unsplash.com/photo-1762112464284-db2e871a9f4f?auto=format&fit=crop&w=700&q=85",
};


const CROP_LABELS = {
  wheat:
    "Wheat",

  paddy:
    "Paddy",

  maize:
    "Maize",

  cotton:
    "Cotton",
};


function normaliseCrop(
  crop
) {
  const value =
    String(
      crop ?? ""
    )
      .trim()
      .toLowerCase();

  if (
    value ===
    "rice"
  ) {
    return "paddy";
  }

  if (
    value ===
    "corn"
  ) {
    return "maize";
  }

  return value;
}


export default function CropIcon({
  crop,
  size = 24,
  className = "",
}) {

  const key =
    normaliseCrop(
      crop
    );

  const image =
    CROP_IMAGES[
      key
    ] ||
    CROP_IMAGES.wheat;

  const label =
    CROP_LABELS[
      key
    ] ||
    "Agricultural produce";


  return (
    <img
      src={image}
      alt={label}
      className={
        `krishi-real-crop-image ${className}`
      }
      width={size}
      height={size}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
}