output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC Identifier"
}

output "db_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "PostgreSQL primary database endpoint"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.artifacts.id
  description = "Encrypted S3 bucket name for reports and imports"
}

output "waf_web_acl_arn" {
  value       = aws_wafv2_web_acl.main.arn
  description = "WAF Web ACL ARN for Application Load Balancer association"
}
