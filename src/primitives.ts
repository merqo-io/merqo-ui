// Public surface of @merqo/ui/primitives. Other src/ui modules stay private.
// dist/primitives.js is a plain re-export shim written by
// scripts/build-index.mjs, so it carries no directive and each client
// primitive keeps its own directive in dist/ui/.
export { cn } from "./lib/utils";
export { Badge, badgeVariants } from "./ui/badge";
export type { BadgeProps } from "./ui/badge";
export { Button, buttonVariants } from "./ui/button";
export type { ButtonProps } from "./ui/button";
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
export { Checkbox } from "./ui/checkbox";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
export { Input } from "./ui/input";
export { Label } from "./ui/label";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
export { Switch } from "./ui/switch";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
export { Textarea } from "./ui/textarea";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
