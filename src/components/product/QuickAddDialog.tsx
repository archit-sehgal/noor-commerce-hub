import { useState } from "react";
import { X, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Color name to CSS color mapping
const colorMap: Record<string, string> = {
  // Reds
  "red": "#DC2626",
  "maroon": "#800000",
  "crimson": "#DC143C",
  "burgundy": "#722F37",
  "wine": "#722F37",
  "cherry": "#DE3163",
  "rose": "#FF007F",
  "coral": "#FF7F50",
  "salmon": "#FA8072",
  "rust": "#B7410E",
  
  // Pinks
  "pink": "#EC4899",
  "hot pink": "#FF69B4",
  "magenta": "#FF00FF",
  "fuchsia": "#FF00FF",
  "blush": "#DE5D83",
  "peach": "#FFCBA4",
  "dusty rose": "#DCAE96",
  
  // Oranges
  "orange": "#F97316",
  "tangerine": "#FF9966",
  "apricot": "#FBCEB1",
  "burnt orange": "#CC5500",
  "terracotta": "#E2725B",
  
  // Yellows
  "yellow": "#EAB308",
  "gold": "#FFD700",
  "golden": "#FFD700",
  "mustard": "#FFDB58",
  "lemon": "#FFF44F",
  "cream": "#FFFDD0",
  "beige": "#F5F5DC",
  "ivory": "#FFFFF0",
  "champagne": "#F7E7CE",
  
  // Greens
  "green": "#22C55E",
  "emerald": "#50C878",
  "olive": "#808000",
  "forest green": "#228B22",
  "mint": "#98FF98",
  "sage": "#9DC183",
  "teal": "#008080",
  "turquoise": "#40E0D0",
  "aqua": "#00FFFF",
  "seafoam": "#93E9BE",
  "lime": "#32CD32",
  "hunter green": "#355E3B",
  
  // Blues
  "blue": "#3B82F6",
  "navy": "#000080",
  "navy blue": "#000080",
  "royal blue": "#4169E1",
  "sky blue": "#87CEEB",
  "baby blue": "#89CFF0",
  "cobalt": "#0047AB",
  "indigo": "#4B0082",
  "powder blue": "#B0E0E6",
  "steel blue": "#4682B4",
  "midnight blue": "#191970",
  "electric blue": "#7DF9FF",
  "cyan": "#00FFFF",
  
  // Purples
  "purple": "#A855F7",
  "violet": "#8B5CF6",
  "lavender": "#E6E6FA",
  "lilac": "#C8A2C8",
  "plum": "#DDA0DD",
  "mauve": "#E0B0FF",
  "orchid": "#DA70D6",
  "grape": "#6F2DA8",
  "amethyst": "#9966CC",
  "eggplant": "#614051",
  "aubergine": "#3D0734",
  
  // Browns
  "brown": "#92400E",
  "chocolate": "#7B3F00",
  "coffee": "#6F4E37",
  "tan": "#D2B48C",
  "camel": "#C19A6B",
  "khaki": "#C3B091",
  "taupe": "#483C32",
  "mocha": "#967969",
  "sand": "#C2B280",
  "cocoa": "#D2691E",
  "bronze": "#CD7F32",
  "copper": "#B87333",
  
  // Neutrals
  "white": "#FFFFFF",
  "off-white": "#FAF9F6",
  "black": "#1a1a1a",
  "grey": "#6B7280",
  "gray": "#6B7280",
  "charcoal": "#36454F",
  "silver": "#C0C0C0",
  "ash": "#B2BEB5",
  "slate": "#708090",
  "graphite": "#383838",
  
  // Multi/Special
  "multi": "linear-gradient(135deg, #FF6B6B, #4ECDC4, #FFE66D, #95E1D3)",
  "multicolor": "linear-gradient(135deg, #FF6B6B, #4ECDC4, #FFE66D, #95E1D3)",
  "rainbow": "linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)",
  "tie-dye": "linear-gradient(135deg, #FF69B4, #87CEEB, #98FB98, #DDA0DD)",
  "ombre": "linear-gradient(180deg, #FFB6C1, #87CEEB)",
};

const getColorStyle = (colorName: string): React.CSSProperties => {
  const normalizedName = colorName.toLowerCase().trim();
  const colorValue = colorMap[normalizedName];
  
  if (colorValue) {
    if (colorValue.includes("gradient")) {
      return { background: colorValue };
    }
    return { backgroundColor: colorValue };
  }
  
  // Try to use the color name directly as CSS color
  return { backgroundColor: colorName.toLowerCase() };
};

const isLightColor = (colorName: string): boolean => {
  const lightColors = [
    "white", "off-white", "cream", "beige", "ivory", "champagne",
    "yellow", "lemon", "gold", "golden", "peach", "blush", "pink",
    "baby blue", "powder blue", "sky blue", "mint", "seafoam",
    "lavender", "lilac", "tan", "sand", "silver", "ash"
  ];
  return lightColors.includes(colorName.toLowerCase().trim());
};

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    sizes?: string[] | null;
    colors?: string[] | null;
    price: number;
    discountPrice?: number | null;
    image: string;
  };
  onConfirm: (size?: string, color?: string) => void;
  isPending?: boolean;
}

const QuickAddDialog = ({ 
  open, 
  onOpenChange, 
  product, 
  onConfirm, 
  isPending 
}: QuickAddDialogProps) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Check if sizes need selection (not just "Free Size" or empty)
  const needsSizeSelection = product.sizes && 
    product.sizes.length > 0 && 
    !(product.sizes.length === 1 && product.sizes[0].toLowerCase() === "free size");
  
  const needsColorSelection = product.colors && product.colors.length > 0;

  const handleConfirm = () => {
    onConfirm(
      needsSizeSelection ? selectedSize : undefined,
      needsColorSelection ? selectedColor : undefined
    );
  };

  const canConfirm = 
    (!needsSizeSelection || selectedSize) && 
    (!needsColorSelection || selectedColor);

  const currentPrice = product.discountPrice || product.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-gold/30">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gold" />
            Quick Add to Cart
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex gap-4 pb-4 border-b border-gold/20">
            <div className="w-20 h-24 overflow-hidden border border-gold/30 flex-shrink-0">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-lg line-clamp-2">{product.name}</h3>
              <p className="text-gold font-display mt-1">₹{currentPrice.toLocaleString()}</p>
            </div>
          </div>

          {/* Size Selection */}
          {needsSizeSelection && (
            <div>
              <label className="text-sm font-display mb-3 block tracking-widest uppercase text-foreground/80">
                Select Size <span className="text-maroon">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes!.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border text-sm font-display tracking-wider transition-all duration-300 ${
                      selectedSize === size
                        ? "border-gold bg-gold text-background"
                        : "border-gold/30 hover:border-gold text-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {needsColorSelection && (
            <div>
              <label className="text-sm font-display mb-3 block tracking-widest uppercase text-foreground/80">
                Select Color <span className="text-maroon">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {product.colors!.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`relative group flex flex-col items-center gap-1.5 transition-all duration-300`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-300 shadow-sm ${
                        selectedColor === color
                          ? "border-gold ring-2 ring-gold ring-offset-2 ring-offset-background scale-110"
                          : "border-gold/30 hover:border-gold/60 hover:scale-105"
                      }`}
                      style={getColorStyle(color)}
                    />
                    <span className={`text-[10px] font-display tracking-wider capitalize ${
                      selectedColor === color ? "text-gold" : "text-muted-foreground"
                    }`}>
                      {color}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isPending}
            className="w-full h-12 bg-maroon hover:bg-maroon-light text-cream border border-gold/40 font-display tracking-[0.2em] text-sm uppercase"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span className="mr-2">✧</span>
                Add to Cart
                <span className="ml-2">✧</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddDialog;
