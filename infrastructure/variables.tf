variable "aws_region" {
  type        = string
  description = "AWS deployment region"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment (production, staging, dev)"
  default     = "production"
}

variable "project_name" {
  type        = string
  description = "Project name identifier"
  default     = "cyber-risk-analyzer"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for VPC"
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  type        = list(string)
  description = "Public subnet CIDR blocks"
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_app_subnets" {
  type        = list(string)
  description = "Private application subnet CIDR blocks"
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "private_db_subnets" {
  type        = list(string)
  description = "Private database subnet CIDR blocks"
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class"
  default     = "db.r6g.xlarge"
}

variable "db_name" {
  type        = string
  description = "PostgreSQL database name"
  default     = "cyber_risk_prod"
}

variable "db_username" {
  type        = string
  description = "PostgreSQL master username"
  default     = "cyber_admin"
}

variable "domain_name" {
  type        = string
  description = "Production custom domain name"
  default     = "cyberrisk.example.com"
}
