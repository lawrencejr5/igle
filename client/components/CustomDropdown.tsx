import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";

type Option = { key: string; label: string };

interface Props {
  options: Option[];
  value: string;
  onChange: (key: string) => void;
}

const CustomDropdown: React.FC<Props> = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<View | null>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  return (
    <View style={styles.container}>
      <View ref={toggleRef} collapsable={false}>
        <Pressable
          style={styles.toggle}
          onPress={() => {
            if (open) {
              setOpen(false);
              return;
            }
            // measure the toggle position on screen to anchor the dropdown
            requestAnimationFrame(() => {
              toggleRef.current?.measureInWindow((x, y, width, height) => {
                setAnchor({ x, y, width, height });
                setOpen(true);
              });
            });
          }}
        >
          <Text style={styles.toggleText}>
            {options.find((o) => o.key === value)?.label}
          </Text>
          <AntDesign name="down" size={14} color="#d7d7d7" />
        </Pressable>
      </View>

      {open && anchor && (
        <Modal transparent animationType="fade" visible={open}>
          {/* backdrop to close on outside press */}
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            {/* empty to capture presses */}
          </Pressable>

          {/* anchored dropdown */}
          <View
            style={[
              styles.portalListWrap,
              {
                top: anchor.y + anchor.height + 4,
                left: anchor.x,
                width: anchor.width,
              },
            ]}
          >
            <ScrollView
              style={styles.portalList}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {options.map((o) => (
                <Pressable
                  key={o.key}
                  onPress={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                  style={styles.item}
                >
                  <Text style={styles.itemText}>{o.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: "relative" },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  toggleText: { color: "#fff", fontFamily: "raleway-regular" },
  // Backdrop covers full screen to allow outside press to close
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  // Portal list wrapper is anchored near the toggle's screen coords
  portalListWrap: {
    position: "absolute",
    backgroundColor: "#121212",
    borderRadius: 10,
    maxHeight: 260,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden",
  },
  portalList: {
    maxHeight: 260,
  },
  item: { paddingVertical: 12, paddingHorizontal: 14 },
  itemText: { color: "#d7d7d7", fontFamily: "raleway-regular" },
});

export default CustomDropdown;
