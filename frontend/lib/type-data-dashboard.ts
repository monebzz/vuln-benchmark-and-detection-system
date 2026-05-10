// data/vulnerabilities.ts
export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  image: string; // you provide image paths
}

export const vulnerabilities: Vulnerability[] = [
  {
    id: "/by-type?type=File+inclusion&page=1",
    title: "File Inclusion",
    description:
      "Improper handling of file paths allows attackers to include and execute unauthorized local or remote files.",
    image: "/icons/file-inclusion.png",
  },
  {
    id: "/by-type?type=Cross+site+scripting+%28XSS%29&page=1",
    title: "Cross-Site Scripting (XSS)",
    description:
      "Injection of malicious scripts into web pages that execute in victims’ browsers.",
    image: "/icons/xss.png",
  },
  {
    id: "/by-type?type=Gain+privilege&page=1",
    title: "Privilege Escalation",
    description:
      "Attackers gain elevated access rights beyond what was originally intended.",
    image: "/icons/privilege-escalation.png",
  },
  {
    id: "/by-type?type=Cross-site+request+forgery+%28CSRF%29&page=1",
    title: "Cross-Site Request Forgery (CSRF)",
    description:
      "Forces authenticated users to perform unwanted actions without their consent.",
    image: "/icons/csrf.png",
  },
  {
    id: "/by-type?type=Input+validation&page=1",
    title: "Input Validation",
    description:
      "Failure to properly validate user input, enabling various injection and logic attacks.",
    image: "/icons/input-validation.png",
  },
  {
    id: "/by-type?type=Directory+traversal&page=1",
    title: "Directory Traversal",
    description:
      "Allows attackers to access restricted directories and files by manipulating file paths.",
    image: "/icons/directory-traversal.png",
  },
];
