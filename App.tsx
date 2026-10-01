import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const GROUP_CODE = "MOB-G09-7573"; // Replace with your real group code

type ZoneStatus = "Active" | "Pending" | "Closed";
type InspectionPriority = "Low" | "Medium" | "High";
type RiskLevel = "Low" | "Medium" | "High";

interface MarketZone {
  id: string;
  name: string;
  category: string;
  status: ZoneStatus;
  priority: InspectionPriority;
  imageLabel: string;
}

interface InspectionDraft {
  vendorAlias: string;
  stallCode: string;
  category: string;
  contactNumber: string;
  riskLevel: RiskLevel;
  consent: boolean;
  imageUrl: string;
}

interface InspectionRecord {
  id: string;
  vendorAlias: string;
  stallCode: string;
  category: string;
  contactNumber: string;
  riskLevel: RiskLevel;
  consent: boolean;
  imageUrl?: string;
  createdAt: string;
}

type TabParamList = {
  Home: undefined;
  NewInspection: undefined;
  Records: undefined;
};

type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Review: { draft: InspectionDraft };
  InspectionDetails: { recordId: string };
};

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

type ReviewScreenProps = NativeStackScreenProps<RootStackParamList, "Review">;
type DetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "InspectionDetails"
>;

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const MOCK_ZONES: MarketZone[] = [
  {
    id: "Z1",
    name: "Vegetable Section A",
    category: "Vegetables",
    status: "Active",
    priority: "High",
    imageLabel: "VG",
  },
  {
    id: "Z2",
    name: "Fruit Sellers Row",
    category: "Fruits",
    status: "Active",
    priority: "Medium",
    imageLabel: "FR",
  },
  {
    id: "Z3",
    name: "Grain Store Area",
    category: "Grains",
    status: "Pending",
    priority: "Low",
    imageLabel: "GR",
  },
  {
    id: "Z4",
    name: "Dairy Corner",
    category: "Dairy",
    status: "Active",
    priority: "High",
    imageLabel: "DY",
  },
  {
    id: "Z5",
    name: "Clothing Stalls",
    category: "Clothing",
    status: "Closed",
    priority: "Medium",
    imageLabel: "CL",
  },
  {
    id: "Z6",
    name: "Household Goods Block",
    category: "Household",
    status: "Pending",
    priority: "Low",
    imageLabel: "HG",
  },
];

const INITIAL_RECORDS: InspectionRecord[] = [];

const CATEGORY_OPTIONS = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Clothing",
  "Household",
];

const RISK_OPTIONS: RiskLevel[] = ["Low", "Medium", "High"];

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const CATEGORY_ICONS: Record<string, IconName> = {
  Vegetables: "leaf-outline",
  Fruits: "nutrition-outline",
  Grains: "flower-outline",
  Dairy: "water-outline",
  Clothing: "shirt-outline",
  Household: "home-outline",
};

// iOS convention: filled glyph when the tab is active, outline otherwise.
const TAB_ICONS: Record<keyof TabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: "home", inactive: "home-outline" },
  NewInspection: { active: "clipboard", inactive: "clipboard-outline" },
  Records: { active: "document-text", inactive: "document-text-outline" },
};

type StatusFilter = "All" | ZoneStatus;
const STATUS_FILTERS: StatusFilter[] = ["All", "Active", "Pending", "Closed"];

const STALL_CODE_PATTERN = /^[A-Z]{3}-\d{2}-\d{3}$/;
const CONTACT_PATTERN = /^(?:\+250|0)7\d{8}$/;
const VENDOR_ALIAS_PATTERN = /^[A-Za-z\s'-]+$/;

type FormValues = {
  vendorAlias: string;
  stallCode: string;
  category: string;
  contactNumber: string;
  riskLevel: RiskLevel | "";
  consent: boolean;
  imageUrl: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type FormTouched = Record<keyof FormValues, boolean>;

const INITIAL_FORM_VALUES: FormValues = {
  vendorAlias: "",
  stallCode: "",
  category: "",
  contactNumber: "",
  riskLevel: "",
  consent: false,
  imageUrl: "",
};

const INITIAL_TOUCHED: FormTouched = {
  vendorAlias: false,
  stallCode: false,
  category: false,
  contactNumber: false,
  riskLevel: false,
  consent: false,
  imageUrl: false,
};

const ALL_TOUCHED: FormTouched = {
  vendorAlias: true,
  stallCode: true,
  category: true,
  contactNumber: true,
  riskLevel: true,
  consent: true,
  imageUrl: true,
};

type AppContextValue = {
  records: InspectionRecord[];
  addInspection: (record: InspectionRecord) => void;
  getRecordById: (id: string) => InspectionRecord | undefined;
  formResetKey: number;
  requestNewInspectionReset: () => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<InspectionRecord[]>(INITIAL_RECORDS);
  const [formResetKey, setFormResetKey] = useState(0);

  const addInspection = useCallback((record: InspectionRecord) => {
    setRecords((previous) => [record, ...previous]);
  }, []);

  const getRecordById = useCallback(
    (id: string) => {
      return records.find((record) => record.id === id);
    },
    [records]
  );

  const requestNewInspectionReset = useCallback(() => {
    setFormResetKey((previous) => previous + 1);
  }, []);

  const value = useMemo(
    () => ({
      records,
      addInspection,
      getRecordById,
      formResetKey,
      requestNewInspectionReset,
    }),
    [
      records,
      addInspection,
      getRecordById,
      formResetKey,
      requestNewInspectionReset,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function formatDateTime(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString();
}

function normalizeStallCode(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

// Turns "mus0101" or "mu0s0101" into "MUS-01-001". Letters and digits are
// collected separately so a digit typed before the third letter is kept.
// Hyphens only appear once the next group has a character, so backspace
// never gets stuck on a separator.
function formatStallCode(value: string) {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letters = raw.replace(/[^A-Z]/g, "").slice(0, 3);
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 5);
  const parts = [letters, digits.slice(0, 2), digits.slice(2, 5)];
  return parts.filter(Boolean).join("-");
}

function normalizeContact(value: string) {
  return value.replace(/[\s\-().]/g, "");
}

function isVideoAsset(asset: {
  type?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
}) {
  if (asset.type === "video" || asset.type === "pairedVideo") {
    return true;
  }

  if (asset.mimeType?.toLowerCase().startsWith("video/")) {
    return true;
  }

  const fileName = asset.fileName?.toLowerCase() ?? "";
  return /\.(mp4|mov|m4v|avi|mkv|webm|3gp)$/.test(fileName);
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const vendorAlias = values.vendorAlias.trim();

  if (!vendorAlias) {
    errors.vendorAlias = "Vendor alias is required.";
  } else if (vendorAlias.length < 3) {
    errors.vendorAlias = "Vendor alias must be at least 3 characters.";
  } else if (vendorAlias.length > 40) {
    errors.vendorAlias = "Vendor alias must be 40 characters or fewer.";
  } else if (!VENDOR_ALIAS_PATTERN.test(vendorAlias)) {
    errors.vendorAlias = "Use letters, spaces, hyphens, or apostrophes only.";
  }

  const stallCode = normalizeStallCode(values.stallCode);

  if (!stallCode) {
    errors.stallCode = "Stall code is required.";
  } else if (!STALL_CODE_PATTERN.test(stallCode)) {
    errors.stallCode = "Use format ABC-01-001.";
  }

  if (!values.category) {
    errors.category = "Select a category.";
  }

  const contactNumber = normalizeContact(values.contactNumber);

  if (!contactNumber) {
    errors.contactNumber = "Contact number is required.";
  } else if (!CONTACT_PATTERN.test(contactNumber)) {
    errors.contactNumber = "Use +2507XXXXXXXX or 07XXXXXXXX.";
  }

  if (!values.riskLevel) {
    errors.riskLevel = "Select a risk level.";
  }

  if (!values.consent) {
    errors.consent = "Consent is required before continuing.";
  }

  if (!values.imageUrl.trim()) {
    errors.imageUrl = "Attach one evidence image before review.";
  }

  return errors;
}

function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.title}>Musanze Safe Market</Text>
      <View style={styles.groupPill}>
        <Text style={styles.groupCode}>{GROUP_CODE}</Text>
      </View>
    </View>
  );
}

function StatusChip({ status }: { status: ZoneStatus }) {
  const color =
    status === "Active"
      ? "#DCFCE7"
      : status === "Pending"
      ? "#FEF3C7"
      : "#FEE2E2";

  const textColor =
    status === "Active"
      ? "#166534"
      : status === "Pending"
      ? "#92400E"
      : "#991B1B";

  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={[styles.chipText, { color: textColor }]}>{status}</Text>
    </View>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: InspectionPriority | RiskLevel;
}) {
  const color =
    priority === "High"
      ? "#DC2626"
      : priority === "Medium"
      ? "#B45309"
      : "#15803D";

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{priority}</Text>
    </View>
  );
}

function ZoneCard({ zone }: { zone: MarketZone }) {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Ionicons
          name={CATEGORY_ICONS[zone.category] ?? "basket-outline"}
          size={28}
          color="#1D4ED8"
        />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.zoneName}>{zone.name}</Text>
        <Text style={styles.category}>{zone.category}</Text>

        <View style={styles.row}>
          <StatusChip status={zone.status} />
          <PriorityBadge priority={zone.priority} />
        </View>
      </View>
    </View>
  );
}

function EmptyState({
  query,
  statusFilter,
}: {
  query: string;
  statusFilter: StatusFilter;
}) {
  const search = query.trim();
  const statusText =
    statusFilter === "All" ? "" : ` in ${statusFilter.toLowerCase()} zones`;

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No zones found</Text>
      <Text style={styles.emptyMessage}>
        {search
          ? `No market zone matches “${search}”${statusText}. Try another name, category, status, or priority.`
          : statusFilter === "All"
            ? "No market zones are available right now."
            : `No ${statusFilter.toLowerCase()} market zones right now.`}
      </Text>
    </View>
  );
}

function CatalogScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { records } = useApp();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filteredZones = useMemo(() => {
    const search = query.trim().toLowerCase();

    return MOCK_ZONES.filter((zone) => {
      if (statusFilter !== "All" && zone.status !== statusFilter) {
        return false;
      }

      return (
        !search ||
        zone.name.toLowerCase().includes(search) ||
        zone.category.toLowerCase().includes(search) ||
        zone.status.toLowerCase().includes(search) ||
        zone.priority.toLowerCase().includes(search)
      );
    });
  }, [query, statusFilter]);

  const countFor = (filter: StatusFilter) =>
    filter === "All"
      ? MOCK_ZONES.length
      : MOCK_ZONES.filter((zone) => zone.status === filter).length;

  const recentRecords = records.slice(0, 3);

  const listHeader = (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Recent inspections
        </Text>

        {records.length > 0 ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("Tabs", { screen: "Records" })}
            accessibilityRole="button"
            accessibilityLabel="View all inspection records"
          >
            <Text style={styles.sectionLink}>View all ({records.length})</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {recentRecords.length === 0 ? (
        <View style={styles.recentEmpty}>
          <Text style={styles.recentEmptyText}>
            No inspections yet. Saved inspections will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.recentList}>
          {recentRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onPress={() =>
                navigation.navigate("InspectionDetails", { recordId: record.id })
              }
            />
          ))}
        </View>
      )}

      <View style={[styles.sectionHeader, { paddingTop: 24 }]}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Market zones
        </Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search zone, category, status, priority"
          placeholderTextColor="#64748B"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search market zones"
        />

        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setQuery("")}
            accessibilityLabel="Clear search"
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((filter) => {
          const selected = statusFilter === filter;

          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
              onPress={() => setStatusFilter(filter)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Show ${filter.toLowerCase()} zones, ${countFor(filter)} total`}
            >
              <Text
                style={[styles.filterText, selected ? styles.filterTextSelected : null]}
              >
                {filter} {countFor(filter)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.resultCount} accessibilityLiveRegion="polite">
        Showing {filteredZones.length} of {MOCK_ZONES.length} zones
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredZones}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <ZoneCard zone={item} />
          </View>
        )}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState query={query} statusFilter={statusFilter} />
        }
      />
    </View>
  );
}

function NewInspectionScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { formResetKey } = useApp();

  const [values, setValues] = useState<FormValues>(INITIAL_FORM_VALUES);
  const [touched, setTouched] = useState<FormTouched>(INITIAL_TOUCHED);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageMessage, setImageMessage] = useState("");
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const errorCount = Object.values(errors).filter(Boolean).length;

  useEffect(() => {
    valuesRef.current = INITIAL_FORM_VALUES;
    setValues(INITIAL_FORM_VALUES);
    setTouched(INITIAL_TOUCHED);
    setErrors({});
    setImageMessage("");
    setShowErrorSummary(false);
  }, [formResetKey]);

  function setField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) {
    const nextValues = { ...valuesRef.current, [field]: value };
    valuesRef.current = nextValues;
    setValues(nextValues);

    const nextErrors = validateForm(nextValues);

    if (Object.keys(nextErrors).length === 0) {
      setShowErrorSummary(false);
    }

    setErrors((previous) => ({
      ...previous,
      [field]: nextErrors[field],
    }));
  }

  function handleBlur(field: keyof FormValues) {
    setTouched((previous) => ({ ...previous, [field]: true }));

    const nextErrors = validateForm(valuesRef.current);
    setErrors((previous) => ({
      ...previous,
      [field]: nextErrors[field],
    }));
  }

  async function pickImage(source: "camera" | "gallery") {
    Keyboard.dismiss();
    setImageMessage("");

    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          setImageMessage(
            "Camera permission denied. Enable it in device settings, then try again."
          );
          return;
        }
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setImageMessage(
            "Gallery permission denied. Enable it in device settings, then try again."
          );
          return;
        }
      }

      const pickerOptions = {
        mediaTypes: ["images"] as ImagePicker.MediaType[],
        allowsEditing: false,
        quality: 0.6,
      };

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled) {
        setImageMessage(
          source === "camera"
            ? "Photo capture cancelled."
            : "Photo selection cancelled."
        );
        return;
      }

      const asset = result.assets[0];

      if (!asset?.uri) {
        setImageMessage("No image was returned.");
        return;
      }

      if (isVideoAsset(asset)) {
        setImageMessage("Please select an image, not a video.");
        return;
      }

      setField("imageUrl", asset.uri);
      setTouched((previous) => ({ ...previous, imageUrl: true }));
      setImageMessage("Image attached.");
    } catch {
      setImageMessage(
        "Could not open camera or gallery. Snack web may not support this. Test in Expo Go on Android."
      );
    }
  }

  function removeImage() {
    setField("imageUrl", "");
    setTouched((previous) => ({ ...previous, imageUrl: true }));
    setImageMessage("Image removed.");
  }

  function handleSubmit() {
    Keyboard.dismiss();

    const currentValues = valuesRef.current;
    const nextErrors = validateForm(currentValues);

    setErrors(nextErrors);
    setTouched(ALL_TOUCHED);

    if (Object.keys(nextErrors).length > 0) {
      setShowErrorSummary(true);
      return;
    }

    setShowErrorSummary(false);

    const draft: InspectionDraft = {
      vendorAlias: currentValues.vendorAlias.trim(),
      stallCode: normalizeStallCode(currentValues.stallCode),
      category: currentValues.category,
      contactNumber: normalizeContact(currentValues.contactNumber),
      riskLevel: currentValues.riskLevel as RiskLevel,
      consent: currentValues.consent,
      imageUrl: currentValues.imageUrl.trim(),
    };

    navigation.navigate("Review", { draft });
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.formTitle}>New Inspection</Text>
        <Text style={styles.formSubtitle}>
          Enter fictional vendor data. All fields and one evidence image are
          validated before review.
        </Text>

        {showErrorSummary && errorCount > 0 ? (
          <View
            style={styles.errorSummary}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <Text style={styles.errorSummaryText}>
              Fix {errorCount} field{errorCount === 1 ? "" : "s"} before
              continuing.
            </Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Vendor alias</Text>
          <TextInput
            style={[
              styles.input,
              touched.vendorAlias && errors.vendorAlias
                ? styles.inputError
                : null,
            ]}
            value={values.vendorAlias}
            onChangeText={(text) => setField("vendorAlias", text)}
            onBlur={() => handleBlur("vendorAlias")}
            placeholder="e.g. Karisimbi Greens"
            placeholderTextColor="#64748B"
            autoCorrect={false}
            accessibilityLabel="Vendor alias"
            accessibilityHint="Enter a fictional vendor name"
          />
          {touched.vendorAlias && errors.vendorAlias ? (
            <Text style={styles.errorText}>{errors.vendorAlias}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Stall code</Text>
          <TextInput
            style={[
              styles.input,
              touched.stallCode && errors.stallCode ? styles.inputError : null,
            ]}
            value={values.stallCode}
            onChangeText={(text) => setField("stallCode", formatStallCode(text))}
            onBlur={() => handleBlur("stallCode")}
            placeholder="MUS-01-001"
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            accessibilityLabel="Stall code"
            accessibilityHint="Format ABC-01-001"
          />
          <Text style={styles.hint}>Example: MUS-01-001</Text>
          {touched.stallCode && errors.stallCode ? (
            <Text style={styles.errorText}>{errors.stallCode}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.optionRow}>
            {CATEGORY_OPTIONS.map((category) => {
              const selected = values.category === category;

              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.optionButton,
                    selected ? styles.optionButtonSelected : null,
                  ]}
                  onPress={() => {
                    setField("category", category);
                    setTouched((previous) => ({ ...previous, category: true }));
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Category ${category}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected ? styles.optionTextSelected : null,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {touched.category && errors.category ? (
            <Text style={styles.errorText}>{errors.category}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contact number</Text>
          <TextInput
            style={[
              styles.input,
              touched.contactNumber && errors.contactNumber
                ? styles.inputError
                : null,
            ]}
            value={values.contactNumber}
            onChangeText={(text) => setField("contactNumber", text)}
            onBlur={() => handleBlur("contactNumber")}
            placeholder="+250788000001"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
            autoCorrect={false}
            maxLength={20}
            accessibilityLabel="Contact number"
            accessibilityHint="Use +2507XXXXXXXX or 07XXXXXXXX"
          />
          <Text style={styles.hint}>Fictional Rwanda-style number only.</Text>
          {touched.contactNumber && errors.contactNumber ? (
            <Text style={styles.errorText}>{errors.contactNumber}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Risk level</Text>
          <View style={styles.optionRow}>
            {RISK_OPTIONS.map((risk) => {
              const selected = values.riskLevel === risk;

              return (
                <TouchableOpacity
                  key={risk}
                  style={[
                    styles.optionButton,
                    selected ? styles.optionButtonSelected : null,
                  ]}
                  onPress={() => {
                    setField("riskLevel", risk);
                    setTouched((previous) => ({ ...previous, riskLevel: true }));
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Risk level ${risk}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected ? styles.optionTextSelected : null,
                    ]}
                  >
                    {risk}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {touched.riskLevel && errors.riskLevel ? (
            <Text style={styles.errorText}>{errors.riskLevel}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Consent confirmation</Text>
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => {
              setField("consent", !values.consent);
              setTouched((previous) => ({ ...previous, consent: true }));
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: values.consent }}
            accessibilityLabel="Confirm vendor consent"
            accessibilityHint="Required before continuing"
          >
            <View
              style={[
                styles.checkbox,
                values.consent ? styles.checkboxChecked : null,
              ]}
            >
              {values.consent ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
            </View>

            <Text style={styles.consentLabel}>
              I confirm this is fictional inspection data and consent was
              obtained.
            </Text>
          </TouchableOpacity>

          {touched.consent && errors.consent ? (
            <Text style={styles.errorText}>{errors.consent}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Evidence image</Text>

          {values.imageUrl ? (
            <View style={styles.previewBox}>
              <Image
                source={{ uri: values.imageUrl }}
                style={styles.previewImage}
                resizeMode="cover"
                accessibilityLabel="Selected inspection image"
              />

              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={styles.primarySmallButton}
                  onPress={() => pickImage("camera")}
                  accessibilityRole="button"
                  accessibilityLabel="Replace image using camera"
                >
                  <Text style={styles.primarySmallButtonText}>Take new</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondarySmallButton}
                  onPress={() => pickImage("gallery")}
                  accessibilityRole="button"
                  accessibilityLabel="Replace image from gallery"
                >
                  <Text style={styles.secondarySmallButtonText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={removeImage}
                  accessibilityRole="button"
                  accessibilityLabel="Remove selected image"
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.attachBox}>
              <Text style={styles.attachText}>No image attached yet.</Text>

              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={styles.primarySmallButton}
                  onPress={() => pickImage("camera")}
                  accessibilityRole="button"
                  accessibilityLabel="Take inspection photo"
                >
                  <Text style={styles.primarySmallButtonText}>Take photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondarySmallButton}
                  onPress={() => pickImage("gallery")}
                  accessibilityRole="button"
                  accessibilityLabel="Choose inspection image from gallery"
                >
                  <Text style={styles.secondarySmallButtonText}>
                    Choose from gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {imageMessage ? (
            <Text style={styles.messageText}>{imageMessage}</Text>
          ) : null}

          {touched.imageUrl && errors.imageUrl ? (
            <Text style={styles.errorText}>{errors.imageUrl}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel="Continue to review"
        >
          <Text style={styles.submitText}>Continue to Review</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ReviewScreen({ route, navigation }: ReviewScreenProps) {
  const { draft } = route.params;
  const { addInspection, requestNewInspectionReset } = useApp();
  const createdAt = useMemo(() => new Date().toISOString(), []);
  const hasSaved = useRef(false);

  function handleConfirmSave() {
    if (hasSaved.current) {
      return;
    }

    hasSaved.current = true;

    const record: InspectionRecord = {
      id: `INS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vendorAlias: draft.vendorAlias,
      stallCode: draft.stallCode,
      category: draft.category,
      contactNumber: draft.contactNumber,
      riskLevel: draft.riskLevel,
      consent: draft.consent,
      imageUrl: draft.imageUrl,
      createdAt,
    };

    addInspection(record);
    requestNewInspectionReset();
    navigation.navigate("Tabs", { screen: "Home" });
  }

  function handleEdit() {
    navigation.goBack();
  }

  function handleDiscard() {
    requestNewInspectionReset();
    navigation.navigate("Tabs", { screen: "Home" });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.reviewContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.formTitle}>Review inspection</Text>
      <Text style={styles.formSubtitle}>
        Confirm the fictional inspection data before saving it to the session.
      </Text>

      <View style={styles.reviewCard}>
        <DetailRow label="Vendor alias" value={draft.vendorAlias} />
        <DetailRow label="Stall code" value={draft.stallCode} />
        <DetailRow label="Category" value={draft.category} />
        <DetailRow label="Contact number" value={draft.contactNumber} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Risk level</Text>
          <PriorityBadge priority={draft.riskLevel} />
        </View>

        <DetailRow
          label="Consent"
          value={draft.consent ? "Given" : "Not given"}
        />
        <DetailRow label="Timestamp" value={formatDateTime(createdAt)} />
        <DetailRow label="Group verification code" value={GROUP_CODE} />
      </View>

      {draft.imageUrl ? (
        <Image
          source={{ uri: draft.imageUrl }}
          style={styles.reviewImage}
          resizeMode="cover"
          accessibilityLabel="Review inspection image"
        />
      ) : (
        <View style={styles.reviewImageBox}>
          <Text style={styles.reviewImageText}>No image attached</Text>
        </View>
      )}

      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleConfirmSave}
          accessibilityLabel="Confirm and save inspection"
        >
          <Text style={styles.submitText}>Confirm and Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleEdit}
          accessibilityLabel="Edit inspection"
        >
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleDiscard}
          accessibilityLabel="Discard inspection and clear the form"
        >
          <Text style={styles.secondaryButtonText}>Discard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function RecordCard({
  record,
  onPress,
}: {
  record: InspectionRecord;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={onPress}
      accessibilityLabel={`Open inspection details for ${record.vendorAlias}`}
    >
      {record.imageUrl ? (
        <Image
          source={{ uri: record.imageUrl }}
          style={styles.recordThumbImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.recordThumb}>
          <Text style={styles.recordThumbText}>{record.riskLevel[0]}</Text>
        </View>
      )}

      <View style={styles.recordBody}>
        <Text style={styles.recordTitle}>{record.vendorAlias}</Text>
        <Text style={styles.recordMeta}>
          {record.stallCode} • {record.category}
        </Text>
        <Text style={styles.recordMeta}>{formatDateTime(record.createdAt)}</Text>

        <View style={styles.row}>
          <PriorityBadge priority={record.riskLevel} />
          <Text style={styles.consentText}>
            Consent: {record.consent ? "Given" : "Not given"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RecordsScreen() {
  const { records } = useApp();
  const navigation = useNavigation<RootNavigation>();

  if (records.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No inspections saved yet</Text>
          <Text style={styles.emptyMessage}>
            Completed inspections will appear here after confirmation.
          </Text>

          <TouchableOpacity
            style={[styles.backButton, { marginTop: 16 }]}
            onPress={() => navigation.navigate("Tabs", { screen: "NewInspection" })}
            accessibilityRole="button"
            accessibilityLabel="Start a new inspection"
          >
            <Text style={styles.backText}>Start an inspection</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordCard
            record={item}
            onPress={() =>
              navigation.navigate("InspectionDetails", {
                recordId: item.id,
              })
            }
          />
        )}
        contentContainerStyle={styles.recordsList}
      />
    </View>
  );
}

function InspectionDetailsScreen({ route, navigation }: DetailsScreenProps) {
  const { getRecordById } = useApp();
  const record = getRecordById(route.params.recordId);

  if (!record) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Record not found</Text>
          <Text style={styles.emptyMessage}>
            This inspection record is no longer available in the current session.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.detailScroll}
      contentContainerStyle={styles.detailScreen}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Back"
      >
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>{record.vendorAlias}</Text>
        <Text style={styles.detailMeta}>{record.stallCode}</Text>
      </View>

      {record.imageUrl ? (
        <Image
          source={{ uri: record.imageUrl }}
          style={styles.detailImagePreview}
          resizeMode="cover"
          accessibilityLabel="Inspection detail image"
        />
      ) : (
        <View style={styles.detailImage}>
          <Text style={styles.detailImageText}>No image attached</Text>
        </View>
      )}

      <View style={styles.detailCard}>
        <DetailRow label="Category" value={record.category} />
        <DetailRow label="Contact number" value={record.contactNumber} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Risk level</Text>
          <PriorityBadge priority={record.riskLevel} />
        </View>

        <DetailRow
          label="Consent"
          value={record.consent ? "Given" : "Not given"}
        />
        <DetailRow label="Saved at" value={formatDateTime(record.createdAt)} />
        <DetailRow label="Group verification code" value={GROUP_CODE} />
      </View>
    </ScrollView>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1D4ED8",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={
              focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive
            }
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={CatalogScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="NewInspection"
        component={NewInspectionScreen}
        options={{ title: "New Inspection" }}
      />
      <Tab.Screen
        name="Records"
        component={RecordsScreen}
        options={{ title: "Records" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={styles.app}>
          <StatusBar barStyle="dark-content" />
          <AppHeader />

          <View style={styles.navigationContainer}>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Tabs" component={TabNavigator} />
                <Stack.Screen name="Review" component={ReviewScreen} />
                <Stack.Screen
                  name="InspectionDetails"
                  component={InspectionDetailsScreen}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </View>
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  groupPill: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },
  groupCode: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E40AF",
  },
  navigationContainer: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E2E8F0",
  },
  tabBarLabel: {
    fontWeight: "600",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
  },
  clearButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  clearText: {
    color: "#0F172A",
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  filterChipSelected: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  filterTextSelected: {
    color: "#FFFFFF",
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: "#475569",
  },
  list: {
    paddingBottom: 80,
    gap: 12,
  },
  listItem: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D4ED8",
    minHeight: 44,
    textAlignVertical: "center",
    lineHeight: 44,
  },
  recentList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  recentEmpty: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
  },
  recentEmptyText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  category: {
    fontSize: 14,
    color: "#475569",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  formContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 80,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  formSubtitle: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  errorSummary: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorSummaryText: {
    color: "#991B1B",
    fontWeight: "800",
    fontSize: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
  },
  inputError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    fontSize: 13,
    color: "#991B1B",
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: "#64748B",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  optionButtonSelected: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  optionText: {
    color: "#0F172A",
    fontWeight: "600",
  },
  optionTextSelected: {
    color: "#FFFFFF",
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    minHeight: 48,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#64748B",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  consentLabel: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    lineHeight: 20,
  },
  previewBox: {
    gap: 10,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  attachBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  attachText: {
    fontSize: 14,
    color: "#475569",
  },
  imageActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primarySmallButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#1D4ED8",
  },
  primarySmallButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondarySmallButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  secondarySmallButtonText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  removeButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
  },
  removeButtonText: {
    color: "#991B1B",
    fontWeight: "700",
  },
  messageText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  reviewContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 80,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reviewImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  reviewImageBox: {
    height: 160,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  reviewImageText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  reviewActions: {
    gap: 10,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  recordsList: {
    padding: 16,
    paddingBottom: 80,
    gap: 12,
  },
  recordCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recordThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  recordThumbImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  recordThumbText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#6D28D9",
  },
  recordBody: {
    flex: 1,
    gap: 4,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  recordMeta: {
    fontSize: 13,
    color: "#475569",
  },
  consentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
  },
  detailScroll: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  detailScreen: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  detailMeta: {
    fontSize: 14,
    color: "#475569",
  },
  detailImagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  detailImage: {
    height: 220,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  detailImageText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  backButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});