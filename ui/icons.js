// Every icon in the app is a MorphIcon (https://www.morphicons.com): Lucide icon
// data drawn through Morphicons, so an icon that changes state *morphs* into the
// next one instead of swapping. Static icons look exactly like Lucide's.
//
//
// WHERE ICONS GO (and where they don't):
//   yes  navigation (sidebar), icon-only buttons (back, close, info, send, mic),
//        and anything that changes state (play → check → lock, chat ↔ mic, volume).
//   no   beside titles or section headers, in front of list rows, or as decoration.
//        If removing the icon loses nothing, it should not be there.
//
// The named exports keep the lucide-react-native component shape
// (size / color / strokeWidth), so existing call sites did not change.
import React from 'react';
import { MorphIcon } from 'morphicons/react-native';
import * as L from 'lucide';

export { MorphIcon };

// Icon data, for call sites that pick an icon from state:
//   <MorphIcon icon={open ? data.ChevronUp : data.ChevronDown} />
export const data = L;

const make = (node, label) => {
  const Icon = ({ size = 24, color, strokeWidth = 2, ...rest }) => (
    <MorphIcon icon={node} size={size} color={color} strokeWidth={strokeWidth} spring="snappy" reducedMotion="user" {...rest} />
  );
  Icon.displayName = label;
  return Icon;
};

export const ArrowLeft = make(L.ArrowLeft, 'ArrowLeft');
export const ArrowRight = make(L.ArrowRight, 'ArrowRight');
export const ArrowUp = make(L.ArrowUp, 'ArrowUp');
export const Upload = make(L.Upload, 'Upload');
export const Files = make(L.Files, 'Files');
export const Folder = make(L.Folder, 'Folder');
export const Link = make(L.Link, 'Link');
export const Music = make(L.Music, 'Music');
export const ExternalLink = make(L.ExternalLink, 'ExternalLink');
export const Image = make(L.Image, 'Image');
export const BookOpen = make(L.BookOpen, 'BookOpen');
export const Briefcase = make(L.Briefcase, 'Briefcase');
export const ChartColumn = make(L.ChartColumn, 'ChartColumn');
export const Check = make(L.Check, 'Check');
export const CheckCheck = make(L.CheckCheck, 'CheckCheck');
export const ChevronDown = make(L.ChevronDown, 'ChevronDown');
export const ChevronLeft = make(L.ChevronLeft, 'ChevronLeft');
export const ChevronUp = make(L.ChevronUp, 'ChevronUp');
export const ChevronRight = make(L.ChevronRight, 'ChevronRight');
export const ClipboardCheck = make(L.ClipboardCheck, 'ClipboardCheck');
export const ClipboardList = make(L.ClipboardList, 'ClipboardList');
export const Clock = make(L.Clock, 'Clock');
export const Code = make(L.Code, 'Code');
export const Dumbbell = make(L.Dumbbell, 'Dumbbell');
export const FileText = make(L.FileText, 'FileText');
export const Info = make(L.Info, 'Info');
export const PanelLeftClose = make(L.PanelLeftClose, 'PanelLeftClose');
export const PanelLeftOpen = make(L.PanelLeftOpen, 'PanelLeftOpen');
export const Search = make(L.Search, 'Search');
export const ListFilter = make(L.ListFilter, 'ListFilter');
export const Heart = make(L.Heart, 'Heart');
export const Timer = make(L.Timer, 'Timer');
export const Lightbulb = make(L.Lightbulb, 'Lightbulb');
export const Lock = make(L.Lock, 'Lock');
export const MessageCircle = make(L.MessageCircle, 'MessageCircle');
export const Megaphone = make(L.Megaphone, 'Megaphone');
export const Mic = make(L.Mic, 'Mic');
export const Moon = make(L.Moon, 'Moon');
export const Palette = make(L.Palette, 'Palette');
export const PenLine = make(L.PenLine, 'PenLine');
export const Presentation = make(L.Presentation, 'Presentation');
export const Repeat = make(L.Repeat, 'Repeat');
export const RotateCcw = make(L.RotateCcw, 'RotateCcw');
export const RotateCw = make(L.RotateCw, 'RotateCw');
export const Scale = make(L.Scale, 'Scale');
export const ShieldCheck = make(L.ShieldCheck, 'ShieldCheck');
export const ShoppingBag = make(L.ShoppingBag, 'ShoppingBag');
export const Sparkles = make(L.Sparkles, 'Sparkles');
export const Square = make(L.Square, 'Square');
export const Sun = make(L.Sun, 'Sun');
export const Target = make(L.Target, 'Target');
export const Terminal = make(L.Terminal, 'Terminal');
export const TrendingUp = make(L.TrendingUp, 'TrendingUp');
export const Trophy = make(L.Trophy, 'Trophy');
export const Type = make(L.Type, 'Type');
export const User = make(L.User, 'User');
export const UserRound = make(L.UserRound, 'UserRound');
export const Volume2 = make(L.Volume2, 'Volume2');
export const VolumeX = make(L.VolumeX, 'VolumeX');
export const X = make(L.X, 'X');
export const Play = make(L.Play, 'Play');
export const CircleUser = make(L.CircleUser, 'CircleUser');
